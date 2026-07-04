import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  include: { subscription: { include: { careRecipient: true } }; log: true };
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

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
        subscription: { include: { careRecipient: true } },
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
          },
        },
        visits: {
          include: { log: { select: { reviewedAt: true, changesRequested: true } } },
          orderBy: { scheduledFor: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const packages = await this.prisma.package.findMany();
    const nameByType = new Map(packages.map((p) => [p.type, p.name]));

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

      const counts = { total: rows.length, reviewed: 0, submitted: 0, pending: 0, missed: 0 };
      for (const v of rows) {
        if (v.logReviewed) counts.reviewed += 1;
        else if (v.hasLog) counts.submitted += 1;
        else if (v.status === VisitStatus.MISSED) counts.missed += 1;
        else counts.pending += 1;
      }

      const upcoming = rows.filter(
        (v) => v.status === VisitStatus.SCHEDULED || v.status === VisitStatus.IN_PROGRESS,
      );

      return {
        assignmentId: a.id,
        subscriptionId: sub.id,
        role: a.role,
        subscriptionStatus: sub.status,
        active: sub.status !== SubscriptionStatus.CANCELLED,
        packageType: sub.packageType,
        packageName: nameByType.get(sub.packageType) ?? null,
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
        subscription: { include: { careRecipient: true } },
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
        subscription: { include: { careRecipient: true } },
        log: true,
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.caregiverId !== caregiverId) {
      throw new ForbiddenException('This visit is not yours');
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
        subscription: { include: { careRecipient: true } },
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
            subscription: { include: { careRecipient: true } },
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
          nurseName: `${l.visit.caregiver.user.firstName} ${l.visit.caregiver.user.lastName}`,
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

    const updated = await this.prisma.visitLog.update({
      where: { visitId },
      data: { changesRequested: true, reviewNote: note ?? null },
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
      reviewNote: updated.reviewNote,
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
      reviewNote: log.reviewNote,
      submittedAt: log.submittedAt,
      reviewedAt: log.reviewedAt,
    };
  }
}
