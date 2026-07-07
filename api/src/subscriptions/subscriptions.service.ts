import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentRole,
  AssignmentStatus,
  CareRecipient,
  NotificationType,
  PackageType,
  Subscription,
  SubscriptionStatus,
  VisitKind,
  VisitStatus,
} from '@prisma/client';
import { AssignmentsService } from '../assignments/assignments.service';
import { PACKAGE_SCHEDULE } from '../common/package-schedule';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePackageDto } from './dto/change-package.dto';
import { RenewDto } from './dto/renew.dto';
import { SetAssessmentDto } from './dto/set-assessment.dto';
import { SetCareStartDto } from './dto/set-care-start.dto';
import { SubscribeDto } from './dto/subscribe.dto';

type SubscriptionWithRecipient = Subscription & {
  careRecipient: CareRecipient;
};

type CareTeam = Awaited<ReturnType<SubscriptionsService['buildCareTeam']>>;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// The joint coordinator + nurse home assessment; a short first visit.
const ASSESSMENT_DURATION_HRS = 1;

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assignments: AssignmentsService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Resolve the FamilyProfile id for an authenticated user. */
  private async familyIdFor(userId: string): Promise<string> {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
    });
    if (!family) throw new NotFoundException('Family profile not found');
    return family.id;
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const familyId = await this.familyIdFor(userId);

    const pkg = await this.prisma.package.findUnique({
      where: { type: dto.packageType },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    // Create the care recipient and the subscription atomically so we never
    // end up with one without the other. Status defaults to MATCHING — billing
    // is post-paid (invoiced at month-end), so care is not gated on payment.
    const subscription = await this.prisma.$transaction(async (tx) => {
      const recipient = await tx.careRecipient.create({
        data: { familyId, ...dto.careRecipient },
      });

      return tx.subscription.create({
        data: {
          familyId,
          careRecipientId: recipient.id,
          packageType: dto.packageType,
          priceGhs: pkg.priceGhs, // snapshot the price at subscribe time
          renewsAt: addMonths(new Date(), 1),
        },
        include: { careRecipient: true },
      });
    });

    // System-triggered matching runs on subscribe. Billing is post-paid, so
    // matching is NOT gated on payment. A matching failure (e.g. no eligible
    // nurses) must not fail the subscription — the case stays MATCHING for retry.
    try {
      await this.assignments.match(subscription.id);
    } catch (err) {
      this.logger.warn(
        `Auto-matching failed for subscription ${subscription.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    return this.toResponse(subscription);
  }

  /** The family's current (non-cancelled) subscription, or null. */
  async getActive(userId: string) {
    const familyId = await this.familyIdFor(userId);

    const subscription = await this.prisma.subscription.findFirst({
      where: { familyId, status: { not: SubscriptionStatus.CANCELLED } },
      orderBy: { createdAt: 'desc' },
      include: { careRecipient: true },
    });

    if (!subscription) return null;

    const careTeam = await this.buildCareTeam(subscription);
    return this.toResponse(subscription, careTeam);
  }

  /**
   * The family's past care engagements — subscriptions they've ended (whether
   * they renewed for a while first or not). Kept as a permanent record of the
   * care their loved one received, newest first.
   */
  async history(userId: string) {
    const familyId = await this.familyIdFor(userId);

    const subscriptions = await this.prisma.subscription.findMany({
      where: { familyId, status: SubscriptionStatus.CANCELLED },
      orderBy: { updatedAt: 'desc' },
      include: { careRecipient: true },
    });

    return Promise.all(
      subscriptions.map(async (s) => {
        const completedVisits = await this.prisma.visit.count({
          where: {
            subscriptionId: s.id,
            status: VisitStatus.COMPLETED,
          },
        });
        return {
          id: s.id,
          packageType: s.packageType,
          status: s.status,
          priceGhs: s.priceGhs.toNumber(),
          startedAt: s.startedAt,
          endedAt: s.updatedAt,
          recipientName: s.careRecipient.name,
          relationToAccount: s.careRecipient.relationToAccount,
          completedVisits,
        };
      }),
    );
  }

  /** Full detail of one past (or current) engagement the family owns. */
  async historyDetail(userId: string, subscriptionId: string) {
    const familyId = await this.familyIdFor(userId);
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { careRecipient: true },
    });
    if (!subscription || subscription.familyId !== familyId) {
      throw new NotFoundException('Subscription not found');
    }

    const [pkg, careTeam, visits] = await Promise.all([
      this.prisma.package.findUnique({
        where: { type: subscription.packageType },
      }),
      this.buildCareTeam(subscription),
      this.prisma.visit.findMany({
        where: { subscriptionId },
        orderBy: { scheduledFor: 'desc' },
        include: {
          caregiver: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          log: { select: { reviewedAt: true } },
        },
      }),
    ]);

    const completedVisits = visits.filter(
      (v) => v.status === VisitStatus.COMPLETED,
    ).length;

    const base = this.toResponse(subscription, careTeam);
    return {
      ...base,
      packageName: pkg?.name ?? null,
      endedAt: subscription.updatedAt,
      completedVisits,
      totalVisits: visits.length,
      visits: visits.map((v) => ({
        id: v.id,
        kind: v.kind,
        status: v.status,
        scheduledFor: v.scheduledFor,
        durationHrs: v.durationHrs,
        nurseName: `${v.caregiver.user.firstName} ${v.caregiver.user.lastName}`,
        hasLog: v.log !== null,
        logReviewed: v.log?.reviewedAt != null,
      })),
    };
  }

  // ── Coordinator: activation flow ──────────────────────────────────────────

  /** Load a subscription and assert the caller is its coordinator. */
  private async requireCoordinatorCase(
    coordinatorUserId: string,
    subscriptionId: string,
  ): Promise<Subscription> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.coordinatorId !== coordinatorUserId) {
      throw new ForbiddenException('This case is not yours to coordinate');
    }
    return subscription;
  }

  /**
   * Coordinator schedules the initial home visit (assessment) at a time agreed
   * with the accepted nurse. Creates or reschedules the INITIAL_ASSESSMENT
   * visit — this first visit is exempt from the 8 AM policy.
   */
  async setAssessment(
    coordinatorUserId: string,
    subscriptionId: string,
    dto: SetAssessmentDto,
  ) {
    const subscription = await this.requireCoordinatorCase(
      coordinatorUserId,
      subscriptionId,
    );
    if (
      subscription.status !== SubscriptionStatus.TEAM_ASSIGNED &&
      subscription.status !== SubscriptionStatus.AWAITING_ACTIVATION
    ) {
      throw new BadRequestException(
        'The assessment can only be scheduled once a nurse has accepted',
      );
    }

    const lead = await this.leadAssignment(subscriptionId);
    if (!lead) throw new BadRequestException('No nurse has accepted this case');

    const when = new Date(dto.assessmentAt);
    const existing = await this.prisma.visit.findFirst({
      where: { subscriptionId, kind: VisitKind.INITIAL_ASSESSMENT },
      select: { id: true },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.visit.update({
          where: { id: existing.id },
          data: {
            scheduledFor: when,
            caregiverId: lead.caregiverId,
            assignmentId: lead.id,
          },
        });
      } else {
        await tx.visit.create({
          data: {
            subscriptionId,
            caregiverId: lead.caregiverId,
            assignmentId: lead.id,
            kind: VisitKind.INITIAL_ASSESSMENT,
            scheduledFor: when,
            durationHrs: ASSESSMENT_DURATION_HRS,
          },
        });
      }
      return tx.subscription.update({
        where: { id: subscriptionId },
        data: { assessmentAt: when },
        include: { careRecipient: true },
      });
    });

    const leadProfile = await this.prisma.caregiverProfile.findUnique({
      where: { id: lead.caregiverId },
      select: { userId: true },
    });
    if (leadProfile) {
      await this.notifications.notify({
        userId: leadProfile.userId,
        type: NotificationType.VISIT_REMINDER,
        title: 'Assessment visit scheduled',
        body: `Your initial home visit for ${updated.careRecipient.name} is set for ${when.toLocaleString()}.`,
      });
    }

    return this.toResponse(updated);
  }

  /**
   * Coordinator marks the initial home visit (assessment) as done. This is a
   * coordinator-side action — the assessment is not part of the nurse's visit
   * log — and it's what unlocks activation.
   */
  async completeAssessment(coordinatorUserId: string, subscriptionId: string) {
    await this.requireCoordinatorCase(coordinatorUserId, subscriptionId);

    const assessment = await this.prisma.visit.findFirst({
      where: { subscriptionId, kind: VisitKind.INITIAL_ASSESSMENT },
    });
    if (!assessment) {
      throw new BadRequestException(
        'Schedule the initial home visit before marking it done',
      );
    }
    if (assessment.status === VisitStatus.COMPLETED) {
      throw new BadRequestException('The assessment is already marked done');
    }

    await this.prisma.visit.update({
      where: { id: assessment.id },
      data: { status: VisitStatus.COMPLETED, endedAt: new Date() },
    });

    const updated = await this.prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
      include: { careRecipient: true },
    });
    return this.toResponse(updated);
  }

  /**
   * Coordinator re-recommends a different package for the family (typically
   * after the assessment). Re-prices the case and refreshes offer payouts, but
   * keeps the same care team and coordinator. Only allowed before activation.
   */
  async changePackage(
    coordinatorUserId: string,
    subscriptionId: string,
    dto: ChangePackageDto,
  ) {
    const subscription = await this.requireCoordinatorCase(
      coordinatorUserId,
      subscriptionId,
    );
    if (
      subscription.status !== SubscriptionStatus.TEAM_ASSIGNED &&
      subscription.status !== SubscriptionStatus.AWAITING_ACTIVATION
    ) {
      throw new BadRequestException(
        'The package can only be changed before care is activated',
      );
    }
    if (subscription.packageType === dto.packageType) {
      throw new BadRequestException('That is already the current package');
    }

    const pkg = await this.prisma.package.findUnique({
      where: { type: dto.packageType },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { packageType: dto.packageType, priceGhs: pkg.priceGhs },
      include: { careRecipient: true, family: true },
    });
    // Re-derive each nurse's payout from the new price (respecting any split).
    await this.assignments.repriceCaseAssignments(subscriptionId);

    await this.notifications.notify({
      userId: updated.family.userId,
      type: NotificationType.GENERAL,
      title: 'Care package updated',
      body: `Your Care Coordinator updated the care plan for ${updated.careRecipient.name} to ${pkg.name}.`,
    });

    return this.toResponse(updated);
  }

  /**
   * Coordinator cancels a pending second-nurse request (the lead changed their
   * mind, or none is available). Clears the flag, withdraws any pending
   * assistant offer, and restores the lead's full payout. Blocked once a second
   * nurse has already accepted.
   */
  async cancelAssistant(coordinatorUserId: string, subscriptionId: string) {
    const subscription = await this.requireCoordinatorCase(
      coordinatorUserId,
      subscriptionId,
    );
    if (!subscription.needsAssistant) {
      throw new BadRequestException(
        'This case has not requested a second nurse',
      );
    }

    const assistant = await this.prisma.assignment.findFirst({
      where: {
        subscriptionId,
        role: AssignmentRole.ASSISTANT,
        status: {
          in: [AssignmentStatus.OFFERED, AssignmentStatus.ACCEPTED],
        },
      },
      include: { caregiver: { select: { userId: true } } },
    });
    if (assistant?.status === AssignmentStatus.ACCEPTED) {
      throw new BadRequestException(
        'A second nurse has already joined this case',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      if (assistant) {
        await tx.assignment.update({
          where: { id: assistant.id },
          data: { status: AssignmentStatus.REPLACED },
        });
      }
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { needsAssistant: false },
      });
    });

    // The lead reverts to the full nurse pool.
    await this.assignments.repriceCaseAssignments(subscriptionId);

    const refreshed = await this.prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
      include: { careRecipient: true },
    });
    if (assistant) {
      await this.notifications.notify({
        userId: assistant.caregiver.userId,
        type: NotificationType.ASSIGNMENT_DECLINED,
        title: 'Assistant offer withdrawn',
        body: `The assistant nurse offer for ${refreshed.careRecipient.name} has been withdrawn.`,
      });
    }

    return this.toResponse(refreshed);
  }

  /** Coordinator captures the agreed care-start date (at the assessment). */
  async setCareStart(
    coordinatorUserId: string,
    subscriptionId: string,
    dto: SetCareStartDto,
  ) {
    const subscription = await this.requireCoordinatorCase(
      coordinatorUserId,
      subscriptionId,
    );
    if (
      subscription.status !== SubscriptionStatus.TEAM_ASSIGNED &&
      subscription.status !== SubscriptionStatus.AWAITING_ACTIVATION
    ) {
      throw new BadRequestException(
        'Care start can only be set once the team is assigned',
      );
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        careStartAt: new Date(dto.careStartAt),
        status: SubscriptionStatus.AWAITING_ACTIVATION,
      },
      include: { careRecipient: true },
    });
    return this.toResponse(updated);
  }

  /** Coordinator activates care once the nurse has started — generates the
   * month's visit schedule from the package cadence. */
  async activate(coordinatorUserId: string, subscriptionId: string) {
    const subscription = await this.requireCoordinatorCase(
      coordinatorUserId,
      subscriptionId,
    );
    if (subscription.status !== SubscriptionStatus.AWAITING_ACTIVATION) {
      throw new BadRequestException('Subscription is not awaiting activation');
    }
    if (!subscription.careStartAt) {
      throw new BadRequestException(
        'Set the care-start date before activating',
      );
    }

    // Care can't begin until the joint home assessment has actually happened.
    const assessment = await this.prisma.visit.findFirst({
      where: { subscriptionId, kind: VisitKind.INITIAL_ASSESSMENT },
      select: { status: true },
    });
    if (!assessment) {
      throw new BadRequestException(
        'Schedule the initial home visit (assessment) before activating',
      );
    }
    if (assessment.status !== VisitStatus.COMPLETED) {
      throw new BadRequestException(
        'The assessment visit must be completed before activating care',
      );
    }

    const lead = await this.leadAssignment(subscriptionId);
    if (!lead) throw new BadRequestException('No nurse has accepted this case');

    // A full-time case that asked for a second nurse can't go live until one is
    // on board — the schedule alternates the two of them.
    let assistant: { id: string; caregiverId: string } | null = null;
    if (subscription.needsAssistant) {
      assistant = await this.acceptedAssistant(subscriptionId);
      if (!assistant) {
        throw new BadRequestException(
          'A second nurse is needed — assign one before activating',
        );
      }
    }

    const visits = this.buildVisitSchedule(
      subscriptionId,
      subscription.packageType,
      lead,
      subscription.careStartAt,
      assistant,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.visit.createMany({ data: visits });
      return tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          activatedAt: new Date(),
        },
        include: { careRecipient: true, family: true },
      });
    });

    await this.notifications.notify({
      userId: updated.family.userId,
      type: NotificationType.CARE_ACTIVATED,
      title: 'Care has started',
      body: `Care for ${updated.careRecipient.name} is now active. ${visits.length} visits have been scheduled.`,
    });

    return this.toResponse(updated);
  }

  // ── Family: renewal decision (no auto-renew) ──────────────────────────────

  /**
   * Family renews the same package for the next period. By default the same
   * care team continues; if the family had concerns they can request a
   * re-match (`dto.rematch`) — the coordinator stays, the nurses are matched
   * afresh and the case flows back through assignment → activation.
   */
  async renew(userId: string, subscriptionId: string, dto: RenewDto = {}) {
    const familyId = await this.familyIdFor(userId);
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription || subscription.familyId !== familyId) {
      throw new NotFoundException('Subscription not found');
    }
    if (subscription.status !== SubscriptionStatus.RENEWING) {
      throw new BadRequestException('Subscription is not awaiting renewal');
    }

    if (dto.rematch) {
      return this.renewWithRematch(subscription, dto.reason);
    }

    const lead = await this.leadAssignment(subscriptionId);
    if (!lead) throw new BadRequestException('This case has no assigned nurse');

    const periodStart = subscription.renewsAt ?? new Date();
    const assistant = subscription.needsAssistant
      ? await this.acceptedAssistant(subscriptionId)
      : null;
    const visits = this.buildVisitSchedule(
      subscriptionId,
      subscription.packageType,
      lead,
      periodStart,
      assistant,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.visit.createMany({ data: visits });
      return tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          renewsAt: addMonths(periodStart, 1),
        },
        include: { careRecipient: true, family: true },
      });
    });

    await this.notifications.notify({
      userId: updated.family.userId,
      type: NotificationType.CARE_ACTIVATED,
      title: 'Care package renewed',
      body: `Your package for ${updated.careRecipient.name} is renewed. ${visits.length} visits have been scheduled.`,
    });

    return this.toResponse(updated);
  }

  /** Family ends the service (e.g. declines renewal). */
  async cancel(userId: string, subscriptionId: string) {
    const familyId = await this.familyIdFor(userId);
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription || subscription.familyId !== familyId) {
      throw new NotFoundException('Subscription not found');
    }
    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.CANCELLED },
      include: { careRecipient: true },
    });
    return this.toResponse(updated);
  }

  /** Renewal where the family wants a different nurse — same coordinator. */
  private async renewWithRematch(subscription: Subscription, reason?: string) {
    const periodStart = subscription.renewsAt ?? new Date();

    // Free the prior team's role slots and send the case back to matching.
    // Completed visits keep their caregiverId for history; their assignmentId
    // is nulled by the optional relation.
    await this.prisma.$transaction(async (tx) => {
      await tx.assignment.deleteMany({
        where: { subscriptionId: subscription.id },
      });
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.MATCHING,
          renewsAt: addMonths(periodStart, 1),
        },
      });
    });

    // Re-run matching (keeps the existing coordinator). A failure leaves the
    // case in MATCHING for retry rather than throwing.
    try {
      await this.assignments.match(subscription.id);
    } catch (err) {
      this.logger.warn(
        `Renewal re-match failed for subscription ${subscription.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    if (subscription.coordinatorId) {
      await this.notifications.notify({
        userId: subscription.coordinatorId,
        type: NotificationType.GENERAL,
        title: 'Renewal with a new nurse',
        body: reason
          ? `${subscription.id}: family requested a different nurse — "${reason}"`
          : 'The family requested a different nurse on renewal.',
      });
    }

    const updated = await this.prisma.subscription.findUniqueOrThrow({
      where: { id: subscription.id },
      include: { careRecipient: true },
    });
    const careTeam = await this.buildCareTeam(updated);
    return this.toResponse(updated, careTeam);
  }

  // ── Coordinator: case list ────────────────────────────────────────────────

  /** Every case this coordinator owns (current and past), newest first. */
  async coordinatingCases(coordinatorUserId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        coordinatorId: coordinatorUserId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        careRecipient: true,
        family: {
          include: {
            user: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
        },
        // The assessment visit, so the coordinator UI knows if it's done yet.
        visits: {
          where: { kind: VisitKind.INITIAL_ASSESSMENT },
          select: { status: true },
        },
      },
    });

    return Promise.all(
      subscriptions.map(async (s) => {
        const [careTeam, roster] = await Promise.all([
          this.buildCareTeam(s),
          this.buildRoster(s.id),
        ]);
        const assessmentDone = s.visits.some(
          (v) => v.status === VisitStatus.COMPLETED,
        );
        return {
          id: s.id,
          packageType: s.packageType,
          status: s.status,
          priceGhs: s.priceGhs.toNumber(),
          assessmentDone,
          needsAssistant: s.needsAssistant,
          createdAt: s.createdAt,
          assessmentAt: s.assessmentAt,
          careStartAt: s.careStartAt,
          activatedAt: s.activatedAt,
          renewsAt: s.renewsAt,
          family: {
            name: `${s.family.user.firstName} ${s.family.user.lastName}`,
            phone: s.family.user.phone,
          },
          recipient: {
            bookingFor: s.careRecipient.bookingFor,
            name: s.careRecipient.name,
            age: s.careRecipient.age,
            gender: s.careRecipient.gender,
            area: s.careRecipient.area,
            city: s.careRecipient.city,
            address: s.careRecipient.address,
            conditions: s.careRecipient.conditions,
            basicCareNeeds: s.careRecipient.basicCareNeeds,
          },
          careTeam,
          roster,
        };
      }),
    );
  }

  /**
   * Coordinator's deep view of one of their cases: what the care package
   * includes, plus every visit on the case with its log status — so they can
   * see what's been delivered and open any submitted log, active case or not.
   */
  async coordinatorCaseDetail(
    coordinatorUserId: string,
    subscriptionId: string,
  ) {
    const subscription = await this.requireCoordinatorCase(
      coordinatorUserId,
      subscriptionId,
    );

    const [pkg, visits] = await Promise.all([
      this.prisma.package.findUnique({
        where: { type: subscription.packageType },
      }),
      this.prisma.visit.findMany({
        where: { subscriptionId },
        orderBy: { scheduledFor: 'desc' },
        include: {
          caregiver: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          log: { select: { reviewedAt: true, changesRequested: true } },
        },
      }),
    ]);

    return {
      packageName: pkg?.name ?? null,
      packageTagline: pkg?.tagline ?? null,
      inclusions: pkg?.inclusions ?? [],
      priceGhs: subscription.priceGhs.toNumber(),
      visits: visits.map((v) => ({
        id: v.id,
        kind: v.kind,
        status: v.status,
        scheduledFor: v.scheduledFor,
        durationHrs: v.durationHrs,
        nurseName: `${v.caregiver.user.firstName} ${v.caregiver.user.lastName}`,
        hasLog: v.log !== null,
        logReviewed: v.log?.reviewedAt != null,
        changesRequested: v.log?.changesRequested ?? false,
      })),
    };
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  // Ordering for the care-team list: lead nurse first, then backups.
  private static readonly ROLE_WEIGHT: Record<AssignmentRole, number> = {
    PRIMARY: 0,
    ASSISTANT: 1,
    BACKUP_1: 2,
    BACKUP_2: 3,
  };

  /** The coordinator + accepted nurses the family can see for a subscription. */
  private async buildCareTeam(subscription: Subscription) {
    const [coordinator, assignments] = await Promise.all([
      subscription.coordinatorId
        ? this.prisma.user.findUnique({
            where: { id: subscription.coordinatorId },
            select: { firstName: true, lastName: true, phone: true },
          })
        : Promise.resolve(null),
      this.prisma.assignment.findMany({
        where: {
          subscriptionId: subscription.id,
          status: {
            in: [AssignmentStatus.ACCEPTED, AssignmentStatus.ACTIVE],
          },
        },
        include: {
          caregiver: {
            include: {
              user: {
                select: { firstName: true, lastName: true, phone: true },
              },
            },
          },
        },
      }),
    ]);

    const nurses = assignments
      .map((a) => {
        const u = a.caregiver.user;
        return {
          assignmentId: a.id,
          role: a.role,
          status: a.status,
          name: `${u.firstName} ${u.lastName}`,
          initials:
            `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase(),
          phone: u.phone,
          qualification: a.caregiver.qualification,
          yearsExperience: a.caregiver.yearsExperience,
          rating: a.caregiver.rating.toNumber(),
          reliabilityScore: a.caregiver.reliabilityScore,
          serviceAreas: a.caregiver.serviceAreas,
        };
      })
      .sort(
        (a, b) =>
          SubscriptionsService.ROLE_WEIGHT[a.role] -
          SubscriptionsService.ROLE_WEIGHT[b.role],
      );

    return {
      coordinator: coordinator
        ? {
            name: `${coordinator.firstName} ${coordinator.lastName}`,
            phone: coordinator.phone,
          }
        : null,
      nurses,
    };
  }

  /** Every assignment on a case (any status) for the coordinator's view. */
  private async buildRoster(subscriptionId: string) {
    const assignments = await this.prisma.assignment.findMany({
      where: { subscriptionId },
      include: {
        caregiver: {
          include: {
            user: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
        },
      },
    });

    return assignments
      .map((a) => {
        const u = a.caregiver.user;
        return {
          assignmentId: a.id,
          role: a.role,
          status: a.status,
          name: `${u.firstName} ${u.lastName}`,
          initials:
            `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase(),
          phone: u.phone,
          expiresAt: a.expiresAt,
        };
      })
      .sort(
        (a, b) =>
          SubscriptionsService.ROLE_WEIGHT[a.role] -
          SubscriptionsService.ROLE_WEIGHT[b.role],
      );
  }

  /**
   * Coordinator re-runs matching for a stalled case (no one accepted),
   * excluding everyone previously offered so a DIFFERENT primary is tried.
   */
  async rematch(coordinatorUserId: string, subscriptionId: string) {
    const subscription = await this.requireCoordinatorCase(
      coordinatorUserId,
      subscriptionId,
    );
    if (subscription.status !== SubscriptionStatus.MATCHING) {
      throw new BadRequestException(
        'Re-matching is only available while the case is still matching',
      );
    }

    const prior = await this.prisma.assignment.findMany({
      where: { subscriptionId },
      select: { caregiverId: true },
    });
    const excludeCaregiverIds = [...new Set(prior.map((a) => a.caregiverId))];

    // Make sure there's someone new before tearing down the current offers.
    const alternatives = await this.prisma.caregiverProfile.count({
      where: {
        licenseVerified: true,
        isAvailable: true,
        id: { notIn: excludeCaregiverIds },
      },
    });
    if (alternatives === 0) {
      throw new BadRequestException(
        'No other nurses are available to re-match right now',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.assignment.deleteMany({ where: { subscriptionId } });
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.MATCHING },
      });
    });

    await this.assignments.match(subscriptionId, { excludeCaregiverIds });

    const updated = await this.prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
      include: { careRecipient: true },
    });
    const careTeam = await this.buildCareTeam(updated);
    return this.toResponse(updated, careTeam);
  }

  private async leadAssignment(subscriptionId: string) {
    return this.prisma.assignment.findFirst({
      where: {
        subscriptionId,
        status: AssignmentStatus.ACCEPTED,
        // The assistant is also ACCEPTED — the lead is never the assistant.
        role: { not: AssignmentRole.ASSISTANT },
      },
      select: { id: true, caregiverId: true },
    });
  }

  /** The accepted second nurse on a case, if one has been assigned. */
  private async acceptedAssistant(subscriptionId: string) {
    return this.prisma.assignment.findFirst({
      where: {
        subscriptionId,
        role: AssignmentRole.ASSISTANT,
        status: AssignmentStatus.ACCEPTED,
      },
      select: { id: true, caregiverId: true },
    });
  }

  /**
   * Generate the month's care visits from the package cadence. Per company
   * policy every care visit runs from a fixed morning start (the time carried
   * on `startDate` — 8:00 AM by default, or whatever the family agreed with the
   * coordinator) for the package's allotted hours. Nurse availability days /
   * working hours are deliberately NOT consulted here.
   */
  private buildVisitSchedule(
    subscriptionId: string,
    packageType: PackageType,
    lead: { id: string; caregiverId: string },
    startDate: Date,
    assistant: { id: string; caregiverId: string } | null = null,
  ) {
    const schedule = PACKAGE_SCHEDULE[packageType];
    return Array.from({ length: schedule.count }, (_, i) => {
      const scheduledFor = new Date(startDate);
      scheduledFor.setDate(scheduledFor.getDate() + i * schedule.intervalDays);
      // With a second nurse, the two alternate whole days (lead on even days,
      // assistant on odd) so they share the full-time rotation.
      const owner = assistant && i % 2 === 1 ? assistant : lead;
      return {
        subscriptionId,
        caregiverId: owner.caregiverId,
        assignmentId: owner.id,
        kind: VisitKind.CARE_VISIT,
        scheduledFor,
        durationHrs: schedule.durationHrs,
      };
    });
  }

  private toResponse(
    s: SubscriptionWithRecipient,
    careTeam: CareTeam = { coordinator: null, nurses: [] },
  ) {
    return {
      id: s.id,
      packageType: s.packageType,
      status: s.status,
      priceGhs: s.priceGhs.toNumber(),
      startedAt: s.startedAt,
      renewsAt: s.renewsAt,
      assessmentAt: s.assessmentAt,
      careStartAt: s.careStartAt,
      activatedAt: s.activatedAt,
      careTeam,
      careRecipient: {
        id: s.careRecipient.id,
        bookingFor: s.careRecipient.bookingFor,
        name: s.careRecipient.name,
        age: s.careRecipient.age,
        gender: s.careRecipient.gender,
        relationToAccount: s.careRecipient.relationToAccount,
        area: s.careRecipient.area,
        city: s.careRecipient.city,
        address: s.careRecipient.address,
        conditions: s.careRecipient.conditions,
        basicCareNeeds: s.careRecipient.basicCareNeeds,
      },
    };
  }
}
