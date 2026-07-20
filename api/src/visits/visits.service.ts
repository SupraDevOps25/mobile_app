import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AssignmentStatus,
  NotificationType,
  Prisma,
  SubscriptionStatus,
  VisitKind,
  VisitLog,
  VisitStatus,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { CreateVisitLogDto } from './dto/create-visit-log.dto';

type VisitRowPayload = Prisma.VisitGetPayload<{
  include: { subscription: { include: { careRecipient: true } } };
}>;

type VisitDetailPayload = Prisma.VisitGetPayload<{
  include: {
    subscription: {
      include: {
        careRecipient: true;
        family: { select: { photoUrl: true } };
      };
    };
    log: true;
  };
}>;

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

@Injectable()
export class VisitsService {
  private readonly logger = new Logger(VisitsService.name);

  // How long after a visit's window (scheduledFor + durationHrs) closes before
  // we give up on it. The window itself scales with the package — Wellness 2h,
  // Live-In 24h — since we key off each visit's own durationHrs, so these are
  // just the buffer on top. A no-show (still SCHEDULED) is flagged quickly; a
  // visit the nurse started but never logged (IN_PROGRESS) gets a longer grace,
  // a full extra day, to let them submit before we mark it missed.
  private static readonly MISSED_GRACE_HOURS = 6;
  private static readonly IN_PROGRESS_GRACE_HOURS = 24;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Auto-resolve stale visits. A care visit whose whole window (scheduledFor +
   * durationHrs) plus a grace buffer has passed but that never reached a log is
   * flagged MISSED: either the nurse never showed (still SCHEDULED) or they
   * started but never submitted the log (IN_PROGRESS, given a longer grace).
   * Runs hourly; MISSED is terminal so billing can proceed. The coordinator is
   * always told; the nurse is told when their started visit lapsed. (The initial
   * assessment is coordinator-managed, so it's left out.)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async flagMissedVisits(): Promise<void> {
    const now = Date.now();
    const hour = 60 * 60 * 1000;

    const open = await this.prisma.visit.findMany({
      where: {
        status: { in: [VisitStatus.SCHEDULED, VisitStatus.IN_PROGRESS] },
        kind: VisitKind.CARE_VISIT,
      },
      include: {
        subscription: {
          select: {
            coordinatorId: true,
            careRecipient: { select: { name: true } },
          },
        },
        caregiver: {
          select: {
            userId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const missed = open.filter((v) => {
      const graceHrs =
        v.status === VisitStatus.IN_PROGRESS
          ? VisitsService.IN_PROGRESS_GRACE_HOURS
          : VisitsService.MISSED_GRACE_HOURS;
      const windowEnd =
        v.scheduledFor.getTime() + (v.durationHrs + graceHrs) * hour;
      return windowEnd < now;
    });
    if (missed.length === 0) return;

    await this.prisma.visit.updateMany({
      where: { id: { in: missed.map((v) => v.id) } },
      data: { status: VisitStatus.MISSED },
    });
    this.logger.log(`Flagged ${missed.length} missed visit(s)`);

    for (const v of missed) {
      const nurse =
        `${v.caregiver.user.firstName} ${v.caregiver.user.lastName}`.trim();
      const recipient = v.subscription.careRecipient.name;
      const dateLabel = v.scheduledFor.toLocaleDateString();
      // IN_PROGRESS = the nurse started the visit but never submitted a log.
      const startedNotLogged = v.status === VisitStatus.IN_PROGRESS;

      if (v.subscription.coordinatorId) {
        await this.notifications.notify({
          userId: v.subscription.coordinatorId,
          type: NotificationType.GENERAL,
          title: startedNotLogged ? 'Visit not logged' : 'Visit missed',
          body: startedNotLogged
            ? `${nurse} started but never logged the ${dateLabel} visit for ${recipient}. It's been marked missed — please follow up.`
            : `${nurse} missed the ${dateLabel} visit for ${recipient}. Please follow up.`,
        });
      }

      // Nudge the nurse when their own started visit lapsed unlogged, so they
      // know and can ask the coordinator/admin to correct it if care happened.
      if (startedNotLogged) {
        await this.notifications.notify({
          userId: v.caregiver.userId,
          type: NotificationType.GENERAL,
          title: 'Visit marked missed',
          body: `Your ${dateLabel} visit for ${recipient} was never logged and has been marked missed. Contact your coordinator if this is a mistake.`,
        });
      }
    }
  }

  /**
   * Admin-only manual override of a visit's status — the safety valve for
   * correcting an auto-flagged miss, or recording one the cron hasn't caught
   * yet. Only admins may change a visit's status directly.
   */
  async adminSetStatus(visitId: string, status: VisitStatus) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });
    if (!visit) throw new NotFoundException('Visit not found');

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        status,
        // Keep endedAt consistent with the new status.
        endedAt: status === VisitStatus.COMPLETED ? new Date() : null,
      },
    });
    return { id: updated.id, status: updated.status };
  }

  private async caregiverIdFor(userId: string): Promise<string> {
    const profile = await this.prisma.caregiverProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Caregiver profile not found');
    return profile.id;
  }

  private async familyIdFor(userId: string): Promise<string> {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
    });
    if (!family) throw new NotFoundException('Family profile not found');
    return family.id;
  }

  // ── Coordinator: schedule a visit ─────────────────────────────────────────

  async scheduleVisit(coordinatorUserId: string, dto: CreateVisitDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
      include: { careRecipient: true },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.coordinatorId !== coordinatorUserId) {
      throw new ForbiddenException('This case is not yours to coordinate');
    }

    // Visits are delivered by the lead nurse (the accepted assignment).
    const lead = await this.prisma.assignment.findFirst({
      where: {
        subscriptionId: dto.subscriptionId,
        status: AssignmentStatus.ACCEPTED,
      },
      include: { caregiver: { select: { userId: true } } },
    });
    if (!lead)
      throw new BadRequestException('No nurse has accepted this case yet');

    const visit = await this.prisma.visit.create({
      data: {
        subscriptionId: dto.subscriptionId,
        caregiverId: lead.caregiverId,
        assignmentId: lead.id,
        kind: dto.kind ?? VisitKind.CARE_VISIT,
        scheduledFor: new Date(dto.scheduledFor),
        durationHrs: dto.durationHrs,
      },
      include: {
        subscription: {
          include: {
            careRecipient: true,
            family: { select: { photoUrl: true } },
          },
        },
        log: true,
      },
    });

    await this.notifications.notify({
      userId: lead.caregiver.userId,
      type: NotificationType.VISIT_REMINDER,
      title: 'New visit scheduled',
      body: `A ${
        visit.kind === VisitKind.INITIAL_ASSESSMENT ? 'home assessment' : 'care'
      } visit for ${subscription.careRecipient.name} has been scheduled.`,
    });

    return this.toVisitDetail(visit);
  }

  // ── Nurse: caseload + delivery ────────────────────────────────────────────

  async upcomingForNurse(userId: string) {
    const caregiverId = await this.caregiverIdFor(userId);
    const visits = await this.prisma.visit.findMany({
      where: {
        caregiverId,
        status: { in: [VisitStatus.SCHEDULED, VisitStatus.IN_PROGRESS] },
        // The assessment is a coordinator-run visit, not part of the nurse's log.
        kind: { not: VisitKind.INITIAL_ASSESSMENT },
      },
      include: { subscription: { include: { careRecipient: true } } },
      orderBy: { scheduledFor: 'asc' },
    });
    return visits.map((v) => this.toVisitRow(v));
  }

  /** The nurse's completed / missed visits, newest first, with log status. */
  async historyForNurse(userId: string) {
    const caregiverId = await this.caregiverIdFor(userId);
    const visits = await this.prisma.visit.findMany({
      where: {
        caregiverId,
        status: { in: [VisitStatus.COMPLETED, VisitStatus.MISSED] },
        kind: { not: VisitKind.INITIAL_ASSESSMENT },
      },
      include: {
        subscription: { include: { careRecipient: true } },
        log: { select: { reviewedAt: true, changesRequested: true } },
      },
      orderBy: { scheduledFor: 'desc' },
    });
    return visits.map((v) => ({
      ...this.toVisitRow(v),
      hasLog: v.log !== null,
      logReviewed: v.log?.reviewedAt != null,
      changesRequested: v.log?.changesRequested ?? false,
    }));
  }

  /**
   * The nurse's caseload grouped by assignment (one card per case they've
   * accepted). Each group carries a visit-status breakdown and the visit rows,
   * so the app can show Active vs Previous assignments and, on tap, the visits
   * split into pending / submitted / reviewed.
   */
  async assignmentsForNurse(userId: string) {
    const caregiverId = await this.caregiverIdFor(userId);
    const assignments = await this.prisma.assignment.findMany({
      where: {
        caregiverId,
        status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.ACTIVE] },
      },
      include: {
        subscription: {
          include: {
            careRecipient: true,
            coordinator: { select: { firstName: true, lastName: true } },
            family: { select: { photoUrl: true } },
          },
        },
        visits: {
          // Care visits only — the assessment is handled by the coordinator.
          where: { kind: { not: VisitKind.INITIAL_ASSESSMENT } },
          include: {
            log: { select: { reviewedAt: true, changesRequested: true } },
          },
          orderBy: { scheduledFor: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const packages = await this.prisma.package.findMany();
    const nameByType = new Map(packages.map((p) => [p.type, p.name]));
    const inclusionsByType = new Map(
      packages.map((p) => [p.type, p.inclusions]),
    );

    // The family's star rating + comment for this nurse, per subscription.
    const reviews = await this.prisma.review.findMany({
      where: {
        caregiverId,
        subscriptionId: { in: assignments.map((a) => a.subscriptionId) },
      },
      select: {
        subscriptionId: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });
    const reviewBySub = new Map(reviews.map((r) => [r.subscriptionId, r]));

    return assignments.map((a) => {
      const sub = a.subscription;
      const c = sub.careRecipient;

      const rows = a.visits.map((v) => ({
        id: v.id,
        kind: v.kind,
        status: v.status,
        scheduledFor: v.scheduledFor,
        durationHrs: v.durationHrs,
        hasLog: v.log !== null,
        logReviewed: v.log?.reviewedAt != null,
        changesRequested: v.log?.changesRequested ?? false,
      }));

      const counts = {
        total: rows.length,
        reviewed: 0,
        submitted: 0,
        pending: 0,
        missed: 0,
      };
      for (const v of rows) {
        if (v.logReviewed) counts.reviewed += 1;
        else if (v.hasLog) counts.submitted += 1;
        else if (v.status === VisitStatus.MISSED) counts.missed += 1;
        else counts.pending += 1;
      }

      const upcoming = rows.filter(
        (v) =>
          v.status === VisitStatus.SCHEDULED ||
          v.status === VisitStatus.IN_PROGRESS,
      );

      return {
        assignmentId: a.id,
        subscriptionId: sub.id,
        role: a.role,
        subscriptionStatus: sub.status,
        active: sub.status !== SubscriptionStatus.CANCELLED,
        packageType: sub.packageType,
        packageName: nameByType.get(sub.packageType) ?? null,
        inclusions: inclusionsByType.get(sub.packageType) ?? [],
        review: reviewBySub.get(sub.id)
          ? {
              rating: reviewBySub.get(sub.id)!.rating,
              comment: reviewBySub.get(sub.id)!.comment,
              createdAt: reviewBySub.get(sub.id)!.createdAt,
            }
          : null,
        coordinatorName: sub.coordinator
          ? `${sub.coordinator.firstName} ${sub.coordinator.lastName}`
          : null,
        client: {
          name: c.name,
          initials: initialsOf(c.name),
          age: c.age,
          gender: c.gender,
          area: c.area,
          city: c.city,
          address: c.address,
          conditions: c.conditions,
          basicCareNeeds: c.basicCareNeeds,
          // The family account holder's photo, for the case avatar.
          photoUrl: sub.family.photoUrl,
        },
        counts,
        nextVisitAt: upcoming.length ? upcoming[0].scheduledFor : null,
        lastVisitAt: rows.length ? rows[rows.length - 1].scheduledFor : null,
        visits: rows,
      };
    });
  }

  async getVisit(userId: string, visitId: string) {
    const caregiverId = await this.caregiverIdFor(userId);
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        subscription: {
          include: {
            careRecipient: true,
            family: { select: { photoUrl: true } },
          },
        },
        log: true,
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.caregiverId !== caregiverId) {
      throw new ForbiddenException('This visit is not yours');
    }
    return this.toVisitDetail(visit);
  }

  async startVisit(userId: string, visitId: string) {
    const caregiverId = await this.caregiverIdFor(userId);
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.caregiverId !== caregiverId) {
      throw new ForbiddenException('This visit is not yours');
    }
    if (visit.kind === VisitKind.INITIAL_ASSESSMENT) {
      throw new BadRequestException(
        'The assessment visit is managed by your coordinator',
      );
    }
    if (visit.status !== VisitStatus.SCHEDULED) {
      throw new BadRequestException('This visit cannot be started');
    }

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: { status: VisitStatus.IN_PROGRESS, startedAt: new Date() },
    });
    return {
      id: updated.id,
      status: updated.status,
      startedAt: updated.startedAt,
    };
  }

  /** Submit the daily care log and complete the visit. */
  async submitLog(userId: string, visitId: string, dto: CreateVisitLogDto) {
    const caregiverId = await this.caregiverIdFor(userId);
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        subscription: {
          include: {
            careRecipient: true,
            family: { select: { photoUrl: true } },
          },
        },
        log: true,
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.caregiverId !== caregiverId) {
      throw new ForbiddenException('This visit is not yours');
    }
    if (visit.kind === VisitKind.INITIAL_ASSESSMENT) {
      throw new BadRequestException(
        'The assessment visit is managed by your coordinator',
      );
    }
    if (visit.status === VisitStatus.COMPLETED || visit.log) {
      throw new BadRequestException('This visit has already been logged');
    }

    const log = await this.prisma.$transaction(async (tx) => {
      const created = await tx.visitLog.create({
        data: {
          visitId,
          summary: dto.summary,
          observations: dto.observations,
          bloodPressure: dto.bloodPressure,
          bloodGlucose: dto.bloodGlucose,
          heartRate: dto.heartRate,
          temperature: dto.temperature,
          medicationsGiven: dto.medicationsGiven ?? [],
          quickLog: dto.quickLog ?? [],
          mood: dto.mood,
          followUpRecommended: dto.followUpRecommended ?? false,
          escalationNeeded: dto.escalationNeeded ?? false,
        },
      });
      await tx.visit.update({
        where: { id: visitId },
        data: { status: VisitStatus.COMPLETED, endedAt: new Date() },
      });
      return created;
    });

    // The coordinator reviews every log.
    if (visit.subscription.coordinatorId) {
      await this.notifications.notify({
        userId: visit.subscription.coordinatorId,
        type: NotificationType.DAILY_LOG_SUBMITTED,
        title: 'Daily care log submitted',
        body: `A care log for ${visit.subscription.careRecipient.name} was submitted${
          dto.escalationNeeded ? ' and flagged for escalation' : ''
        }.`,
      });
    }

    return this.toLogResponse(log);
  }

  /** Edit an already-submitted log. Allowed until the coordinator marks it
   * reviewed — covers a nurse fixing their own log or responding to a
   * coordinator's "changes requested". */
  async updateLog(userId: string, visitId: string, dto: CreateVisitLogDto) {
    const caregiverId = await this.caregiverIdFor(userId);
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        subscription: {
          include: {
            careRecipient: true,
            family: { select: { photoUrl: true } },
          },
        },
        log: true,
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.caregiverId !== caregiverId) {
      throw new ForbiddenException('This visit is not yours');
    }
    if (!visit.log) throw new BadRequestException('No log to edit yet');
    if (visit.log.reviewedAt) {
      throw new BadRequestException('A reviewed log can no longer be edited');
    }

    const log = await this.prisma.visitLog.update({
      where: { visitId },
      data: {
        summary: dto.summary,
        observations: dto.observations,
        bloodPressure: dto.bloodPressure,
        bloodGlucose: dto.bloodGlucose,
        heartRate: dto.heartRate,
        temperature: dto.temperature,
        medicationsGiven: dto.medicationsGiven ?? [],
        quickLog: dto.quickLog ?? [],
        mood: dto.mood,
        followUpRecommended: dto.followUpRecommended ?? false,
        escalationNeeded: dto.escalationNeeded ?? false,
        // Editing clears the "changes requested" flag and re-submits for review.
        changesRequested: false,
        submittedAt: new Date(),
      },
    });

    if (visit.subscription.coordinatorId) {
      await this.notifications.notify({
        userId: visit.subscription.coordinatorId,
        type: NotificationType.DAILY_LOG_SUBMITTED,
        title: 'Care log updated',
        body: `${visit.subscription.careRecipient.name}'s care log was revised and resubmitted for review.`,
      });
    }

    return this.toLogResponse(log);
  }

  // ── Coordinator: review logs ──────────────────────────────────────────────

  /** All logs across the coordinator's cases — those needing review first,
   * then already-reviewed — each with full detail for the review screen. */
  async allLogs(coordinatorUserId: string) {
    const logs = await this.prisma.visitLog.findMany({
      where: {
        visit: { subscription: { coordinatorId: coordinatorUserId } },
      },
      include: {
        visit: {
          include: {
            subscription: {
              include: {
                careRecipient: true,
                family: { select: { photoUrl: true } },
              },
            },
            caregiver: { include: { user: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
    return (
      logs
        .map((l) => ({
          ...this.toLogResponse(l),
          clientName: l.visit.subscription.careRecipient.name,
          clientPhotoUrl: l.visit.subscription.family.photoUrl,
          nurseName: `${l.visit.caregiver.user.firstName} ${l.visit.caregiver.user.lastName}`,
          nursePhotoUrl: l.visit.caregiver.photoUrl,
          visitKind: l.visit.kind,
          scheduledFor: l.visit.scheduledFor,
          durationHrs: l.visit.durationHrs,
          visitStatus: l.visit.status,
        }))
        // Pending (not yet reviewed) bubble to the top; date order kept within.
        .sort((a, b) => (a.reviewedAt ? 1 : 0) - (b.reviewedAt ? 1 : 0))
    );
  }

  async reviewLog(coordinatorUserId: string, visitId: string) {
    const log = await this.prisma.visitLog.findUnique({
      where: { visitId },
      include: { visit: { include: { subscription: true } } },
    });
    if (!log) throw new NotFoundException('Visit log not found');
    if (log.visit.subscription.coordinatorId !== coordinatorUserId) {
      throw new ForbiddenException('This case is not yours');
    }
    if (log.reviewedAt) {
      throw new BadRequestException('This log has already been reviewed');
    }

    const updated = await this.prisma.visitLog.update({
      where: { visitId },
      data: { reviewedById: coordinatorUserId, reviewedAt: new Date() },
    });
    return { visitId, reviewedAt: updated.reviewedAt };
  }

  /** Coordinator asks the nurse to revise a log before it's approved. */
  async requestChanges(
    coordinatorUserId: string,
    visitId: string,
    note?: string,
  ) {
    const log = await this.prisma.visitLog.findUnique({
      where: { visitId },
      include: {
        visit: {
          include: {
            subscription: { include: { careRecipient: true } },
            caregiver: { select: { userId: true } },
          },
        },
      },
    });
    if (!log) throw new NotFoundException('Visit log not found');
    if (log.visit.subscription.coordinatorId !== coordinatorUserId) {
      throw new ForbiddenException('This case is not yours');
    }
    if (log.reviewedAt) {
      throw new BadRequestException('A reviewed log can no longer be changed');
    }

    const trimmed = note?.trim();
    const updated = await this.prisma.visitLog.update({
      where: { visitId },
      data: {
        changesRequested: true,
        // Append to the thread so earlier requests aren't lost.
        ...(trimmed ? { reviewNotes: { push: trimmed } } : {}),
      },
    });

    await this.notifications.notify({
      userId: log.visit.caregiver.userId,
      type: NotificationType.DAILY_LOG_SUBMITTED,
      title: 'Changes requested on your care log',
      body: note
        ? `Your Care Coordinator asked you to revise the log for ${log.visit.subscription.careRecipient.name}: "${note}"`
        : `Your Care Coordinator asked you to revise the log for ${log.visit.subscription.careRecipient.name}.`,
    });

    return {
      visitId,
      changesRequested: updated.changesRequested,
      reviewNotes: updated.reviewNotes,
    };
  }

  // ── Family: care plan visits ──────────────────────────────────────────────

  async carePlanVisits(userId: string) {
    const familyId = await this.familyIdFor(userId);
    const visits = await this.prisma.visit.findMany({
      where: { subscription: { familyId } },
      include: {
        caregiver: { include: { user: true } },
        log: { select: { reviewedAt: true } },
      },
      orderBy: { scheduledFor: 'desc' },
    });
    return visits.map((v) => ({
      id: v.id,
      kind: v.kind,
      status: v.status,
      scheduledFor: v.scheduledFor,
      durationHrs: v.durationHrs,
      nurseName: `${v.caregiver.user.firstName} ${v.caregiver.user.lastName}`,
      hasLog: v.log !== null,
      logReviewed: v.log?.reviewedAt != null,
    }));
  }

  // ── Response shaping ──────────────────────────────────────────────────────

  private toVisitRow(v: VisitRowPayload) {
    const c = v.subscription.careRecipient;
    return {
      id: v.id,
      kind: v.kind,
      status: v.status,
      scheduledFor: v.scheduledFor,
      durationHrs: v.durationHrs,
      clientName: c.name,
      clientInitials: initialsOf(c.name),
      area: c.area,
    };
  }

  private toVisitDetail(v: VisitDetailPayload) {
    const c = v.subscription.careRecipient;
    return {
      id: v.id,
      kind: v.kind,
      status: v.status,
      scheduledFor: v.scheduledFor,
      durationHrs: v.durationHrs,
      startedAt: v.startedAt,
      endedAt: v.endedAt,
      client: {
        name: c.name,
        initials: initialsOf(c.name),
        age: c.age,
        gender: c.gender,
        area: c.area,
        city: c.city,
        address: c.address,
        conditions: c.conditions,
        basicCareNeeds: c.basicCareNeeds,
        // The family account holder's photo, for the visit avatar.
        photoUrl: v.subscription.family.photoUrl,
      },
      log: v.log ? this.toLogResponse(v.log) : null,
    };
  }

  private toLogResponse(log: VisitLog) {
    return {
      visitId: log.visitId,
      summary: log.summary,
      observations: log.observations,
      bloodPressure: log.bloodPressure,
      bloodGlucose: log.bloodGlucose,
      heartRate: log.heartRate,
      temperature: log.temperature,
      medicationsGiven: log.medicationsGiven,
      quickLog: log.quickLog,
      mood: log.mood,
      followUpRecommended: log.followUpRecommended,
      escalationNeeded: log.escalationNeeded,
      changesRequested: log.changesRequested,
      reviewNotes: log.reviewNotes,
      submittedAt: log.submittedAt,
      reviewedAt: log.reviewedAt,
    };
  }
}
