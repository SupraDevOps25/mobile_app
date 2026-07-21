import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AssignmentRole,
  AssignmentStatus,
  Gender,
  NotificationType,
  Package,
  PackageType,
  Prisma,
  Role,
  SubscriptionStatus,
} from '@prisma/client';
import { PACKAGE_SCHEDULE } from '../common/package-schedule';
import { caregiverVisitCounts } from '../common/reliability';
import { caregiverReviewStats, reviewStatsFor } from '../common/review-stats';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { rankCaregivers } from './matching';

// Primary (and each activated backup) has this long to accept before the
// offer escalates to the next nurse in the ranked order.
const OFFER_WINDOW_MS = 5 * 60 * 1000;

const ROLES_IN_ORDER: AssignmentRole[] = [
  AssignmentRole.PRIMARY,
  AssignmentRole.BACKUP_1,
  AssignmentRole.BACKUP_2,
];

// How a family's monthly payment is divided: nurses 60%, coordinator 8%,
// Supracarer 32%. The 60% nurse pool goes to the single delivering nurse, or is
// split equally when a second (assistant) nurse shares the rotation.
const NURSE_POOL_FRACTION = 0.6;

// Short-visit packages have few daily hours, so one nurse can serve several
// families a day (bounded by their Max visits/day). The long packages occupy a
// nurse full-time — they can hold only a single active case.
const SHORT_VISIT_PACKAGES: ReadonlySet<PackageType> = new Set([
  PackageType.WELLNESS,
  PackageType.DAILY_ASSIST,
]);

const ROLE_LABEL: Record<AssignmentRole, string> = {
  PRIMARY: 'primary nurse',
  ASSISTANT: 'assistant nurse',
  BACKUP_1: 'backup nurse #1',
  BACKUP_2: 'backup nurse #2',
};

type OfferAssignment = Prisma.AssignmentGetPayload<{
  include: {
    subscription: {
      include: {
        careRecipient: true;
        coordinator: true;
        family: { include: { user: true } };
      };
    };
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
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

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

  /** Least-loaded care coordinator, or null if none exist. */
  private async pickCoordinator(): Promise<string | null> {
    const coordinators = await this.prisma.user.findMany({
      where: { role: Role.CARE_COORDINATOR },
      select: {
        id: true,
        _count: { select: { coordinatedSubscriptions: true } },
      },
    });
    if (coordinators.length === 0) return null;
    coordinators.sort(
      (a, b) =>
        a._count.coordinatedSubscriptions - b._count.coordinatedSubscriptions,
    );
    return coordinators[0].id;
  }

  /**
   * Eligible caregivers for a case, ranked best-first. Applies the same rules
   * as the initial match — license + availability, the same-gender policy, and
   * capacity (a long package needs a fully-free nurse; a short one fits within
   * Max visits/day) — minus anyone in `excludeCaregiverIds`. Returns [] when no
   * one qualifies.
   */
  private async rankedEligibleCaregivers(
    subscription: {
      familyId: string;
      packageType: PackageType;
      careRecipient: { gender: Gender; area: string };
    },
    excludeCaregiverIds: string[],
  ) {
    const where: Prisma.CaregiverProfileWhereInput = {
      licenseVerified: true,
      isAvailable: true,
      // Gender policy: a nurse is matched only to a same-gender patient.
      gender: subscription.careRecipient.gender,
    };
    if (excludeCaregiverIds.length) where.id = { notIn: excludeCaregiverIds };

    const genderEligible = await this.prisma.caregiverProfile.findMany({
      where,
    });
    if (genderEligible.length === 0) return [];

    // Capacity check. Long packages occupy a nurse full-time (max one active
    // case); short-visit packages let a nurse take several families a day, up to
    // their Max visits/day. Only active care commitments count.
    const targetIsShort = SHORT_VISIT_PACKAGES.has(subscription.packageType);
    const activeAssignments = await this.prisma.assignment.findMany({
      where: {
        caregiverId: { in: genderEligible.map((c) => c.id) },
        status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.ACTIVE] },
        subscription: { status: { not: SubscriptionStatus.CANCELLED } },
      },
      select: {
        caregiverId: true,
        subscription: { select: { packageType: true } },
      },
    });
    const loadByCaregiver = new Map<string, { long: number; short: number }>();
    for (const a of activeAssignments) {
      const load = loadByCaregiver.get(a.caregiverId) ?? { long: 0, short: 0 };
      if (SHORT_VISIT_PACKAGES.has(a.subscription.packageType)) load.short += 1;
      else load.long += 1;
      loadByCaregiver.set(a.caregiverId, load);
    }

    const eligible = genderEligible.filter((c) => {
      const load = loadByCaregiver.get(c.id) ?? { long: 0, short: 0 };
      if (load.long > 0) return false;
      return targetIsShort ? load.short < c.maxVisitsPerDay : load.short === 0;
    });
    if (eligible.length === 0) return [];

    const priorAssignments = await this.prisma.assignment.findMany({
      where: {
        subscription: { familyId: subscription.familyId },
        status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.ACTIVE] },
      },
      select: { caregiverId: true },
    });
    const priorCaregiverIds = new Set(
      priorAssignments.map((a) => a.caregiverId),
    );

    // Reliability inputs (completed vs missed visits) + rating inputs (live from
    // the Review table) per eligible nurse — the source of truth for both.
    const eligibleIds = eligible.map((c) => c.id);
    const [visitCounts, reviewStats] = await Promise.all([
      caregiverVisitCounts(this.prisma, eligibleIds),
      caregiverReviewStats(this.prisma, eligibleIds),
    ]);

    const ranked = rankCaregivers(
      eligible.map((c) => {
        const counts = visitCounts.get(c.id);
        const stats = reviewStatsFor(reviewStats, c.id);
        return {
          id: c.id,
          yearsExperience: c.yearsExperience,
          completedVisits: counts?.completed ?? 0,
          missedVisits: counts?.missed ?? 0,
          rating: stats.rating,
          totalReviews: stats.totalReviews,
          serviceAreas: c.serviceAreas,
        };
      }),
      { recipientArea: subscription.careRecipient.area, priorCaregiverIds },
    );
    const byId = new Map(eligible.map((c) => [c.id, c]));
    return ranked
      .map((r) => byId.get(r.id))
      .filter((c): c is (typeof eligible)[number] => c !== undefined);
  }

  // ── System-triggered matching ─────────────────────────────────────────────

  /**
   * Runs automatically when a subscription needs a care team. Ranks eligible
   * nurses, creates Primary + Backup offers (only the Primary is "live" with a
   * 5-minute clock), attaches + notifies a coordinator.
   */
  async match(
    subscriptionId: string,
    opts?: { excludeCaregiverIds?: string[] },
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { careRecipient: true, assignments: true },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.assignments.length > 0) {
      throw new BadRequestException('Subscription already has a care team');
    }
    if (subscription.status !== SubscriptionStatus.MATCHING) {
      throw new BadRequestException('Subscription is not awaiting matching');
    }

    const pkg = await this.prisma.package.findUnique({
      where: { type: subscription.packageType },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    // Optionally skip nurses who already had (and lost) this offer, so a
    // coordinator-triggered re-match lands on a different primary.
    const exclude = opts?.excludeCaregiverIds ?? [];
    const ranked = await this.rankedEligibleCaregivers(subscription, exclude);
    if (ranked.length === 0) {
      throw new BadRequestException('No eligible caregivers are available');
    }

    const picks = ranked.slice(0, ROLES_IN_ORDER.length);
    const price = pkg.priceGhs.toNumber();
    // Keep the existing coordinator (e.g. on a renewal re-match) for continuity;
    // only assign a fresh one when the case has none yet.
    const existingCoordinatorId = subscription.coordinatorId;
    const coordinatorId =
      existingCoordinatorId ?? (await this.pickCoordinator());

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < picks.length; i++) {
        const role = ROLES_IN_ORDER[i];
        await tx.assignment.create({
          data: {
            subscriptionId,
            caregiverId: picks[i].id,
            role,
            payoutGhs: Math.round(price * NURSE_POOL_FRACTION),
            // Only the primary is live initially; backups wait their turn.
            expiresAt:
              role === AssignmentRole.PRIMARY
                ? new Date(Date.now() + OFFER_WINDOW_MS)
                : null,
          },
        });
      }
      if (coordinatorId && !existingCoordinatorId) {
        await tx.subscription.update({
          where: { id: subscriptionId },
          data: { coordinatorId },
        });
      }
    });

    // Notify the primary nurse (on the clock) and the coordinator.
    const primary = picks[0];
    if (primary) {
      await this.notifications.notify({
        userId: primary.userId,
        type: NotificationType.ASSIGNMENT_OFFER,
        title: 'New assignment offer',
        body: `You've been matched with ${subscription.careRecipient.name} as primary nurse. You have 5 minutes to accept.`,
      });
    }
    if (coordinatorId) {
      await this.notifications.notify({
        userId: coordinatorId,
        type: NotificationType.GENERAL,
        title: 'New case to coordinate',
        body: `A care team has been matched for ${subscription.careRecipient.name}.`,
      });
    }

    return {
      subscriptionId,
      coordinatorId,
      offers: picks.map((p, i) => ({
        caregiverId: p.id,
        role: ROLES_IN_ORDER[i],
      })),
    };
  }

  /** Put the next ranked backup on the clock, or alert the coordinator. */
  private async activateNext(subscriptionId: string) {
    const next = await this.prisma.assignment.findFirst({
      where: {
        subscriptionId,
        status: AssignmentStatus.OFFERED,
        expiresAt: null,
      },
      orderBy: { role: 'asc' },
      include: {
        caregiver: { select: { userId: true } },
        subscription: {
          select: { careRecipient: { select: { name: true } } },
        },
      },
    });

    if (next) {
      await this.prisma.assignment.update({
        where: { id: next.id },
        data: { expiresAt: new Date(Date.now() + OFFER_WINDOW_MS) },
      });
      await this.notifications.notify({
        userId: next.caregiver.userId,
        type: NotificationType.ASSIGNMENT_OFFER,
        title: 'Assignment offer activated',
        body: `You've been activated for ${next.subscription.careRecipient.name} as ${ROLE_LABEL[next.role]}. You have 5 minutes to accept.`,
      });
      return;
    }

    // No backups left — the case needs coordinator intervention.
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        coordinatorId: true,
        careRecipient: { select: { name: true } },
      },
    });
    if (sub?.coordinatorId) {
      await this.notifications.notify({
        userId: sub.coordinatorId,
        type: NotificationType.GENERAL,
        title: 'Care team needs attention',
        body: `No nurse accepted the offer for ${sub.careRecipient.name}. Please review and re-match.`,
      });
    }
  }

  // ── Escalation cron — runs every minute ───────────────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async escalateExpiredOffers() {
    const now = new Date();
    // expiresAt: { lt: now } only matches live offers (nulls excluded).
    const expired = await this.prisma.assignment.findMany({
      where: { status: AssignmentStatus.OFFERED, expiresAt: { lt: now } },
    });
    if (expired.length === 0) return;

    this.logger.log(`Escalating ${expired.length} expired offer(s)`);
    for (const a of expired) {
      await this.prisma.assignment.update({
        where: { id: a.id },
        data: { status: AssignmentStatus.REPLACED },
      });
      if (a.role === AssignmentRole.ASSISTANT) {
        // Assistant offers have no backup chain — restore the lead's full pool
        // and alert the coordinator to re-assign a second nurse.
        await this.repriceCaseAssignments(a.subscriptionId);
        await this.notifyAssistantLapsed(a.subscriptionId);
      } else {
        await this.activateNext(a.subscriptionId);
      }
    }
  }

  /** Tell the coordinator an assistant offer went unanswered. */
  private async notifyAssistantLapsed(subscriptionId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        coordinatorId: true,
        careRecipient: { select: { name: true } },
      },
    });
    if (sub?.coordinatorId) {
      await this.notifications.notify({
        userId: sub.coordinatorId,
        type: NotificationType.GENERAL,
        title: 'Assistant nurse offer lapsed',
        body: `The assistant nurse offer for ${sub.careRecipient.name} went unanswered. Please assign another second nurse.`,
      });
    }
  }

  // ── Nurse: view offers / caseload ─────────────────────────────────────────

  async offersFor(userId: string) {
    const caregiverId = await this.caregiverIdFor(userId);
    // Only live offers (on the clock, not yet expired).
    const assignments = await this.prisma.assignment.findMany({
      where: {
        caregiverId,
        status: AssignmentStatus.OFFERED,
        expiresAt: { gt: new Date() },
      },
      include: {
        subscription: {
          include: {
            careRecipient: true,
            coordinator: true,
            family: { include: { user: true } },
          },
        },
      },
      orderBy: { offeredAt: 'desc' },
    });
    return this.withPackages(assignments);
  }

  async mine(userId: string) {
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
            coordinator: true,
            family: { include: { user: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return this.withPackages(assignments);
  }

  async getOne(userId: string, assignmentId: string) {
    const caregiverId = await this.caregiverIdFor(userId);
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        subscription: {
          include: {
            careRecipient: true,
            coordinator: true,
            family: { include: { user: true } },
          },
        },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.caregiverId !== caregiverId) {
      throw new ForbiddenException('This assignment is not yours');
    }
    const pkg = await this.prisma.package.findUnique({
      where: { type: assignment.subscription.packageType },
    });
    return this.buildOffer(assignment, pkg);
  }

  // ── Nurse: respond to an offer ────────────────────────────────────────────

  async accept(userId: string, assignmentId: string) {
    const caregiverId = await this.caregiverIdFor(userId);
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        subscription: { include: { careRecipient: true, family: true } },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.caregiverId !== caregiverId) {
      throw new ForbiddenException('This assignment is not yours');
    }
    if (assignment.status !== AssignmentStatus.OFFERED) {
      throw new BadRequestException('This offer is no longer open');
    }
    if (!assignment.expiresAt || assignment.expiresAt < new Date()) {
      throw new BadRequestException('This offer has expired');
    }

    const sub = assignment.subscription;

    // Whoever accepts the live offer becomes the lead; the team is in place.
    await this.prisma.$transaction(async (tx) => {
      await tx.assignment.update({
        where: { id: assignmentId },
        data: { status: AssignmentStatus.ACCEPTED, respondedAt: new Date() },
      });
      if (sub.status === SubscriptionStatus.MATCHING) {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: SubscriptionStatus.TEAM_ASSIGNED },
        });
      }
    });

    if (sub.coordinatorId) {
      await this.notifications.notify({
        userId: sub.coordinatorId,
        type: NotificationType.ASSIGNMENT_ACCEPTED,
        title: 'Assignment accepted',
        body: `A nurse accepted the ${ROLE_LABEL[assignment.role]} role for ${sub.careRecipient.name}.`,
      });
    }
    // The assistant joins an already-assigned team, so don't re-announce the
    // team to the family — that only fires for the lead nurse's acceptance.
    if (assignment.role !== AssignmentRole.ASSISTANT) {
      await this.notifications.notify({
        userId: sub.family.userId,
        type: NotificationType.TEAM_ASSIGNED,
        title: 'Your care team is assigned',
        body: `A nurse has been assigned for ${sub.careRecipient.name}. Your Care Coordinator will be in touch.`,
      });
    }

    return { id: assignment.id, status: AssignmentStatus.ACCEPTED };
  }

  async decline(userId: string, assignmentId: string) {
    const caregiverId = await this.caregiverIdFor(userId);
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { subscription: { include: { careRecipient: true } } },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.caregiverId !== caregiverId) {
      throw new ForbiddenException('This assignment is not yours');
    }
    if (assignment.status !== AssignmentStatus.OFFERED) {
      throw new BadRequestException('This offer is no longer open');
    }

    await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: AssignmentStatus.DECLINED, respondedAt: new Date() },
    });

    if (assignment.subscription.coordinatorId) {
      await this.notifications.notify({
        userId: assignment.subscription.coordinatorId,
        type: NotificationType.ASSIGNMENT_DECLINED,
        title: 'Assignment declined',
        body: `A nurse declined the ${ROLE_LABEL[assignment.role]} role for ${assignment.subscription.careRecipient.name}.`,
      });
    }

    if (assignment.role === AssignmentRole.ASSISTANT) {
      // An assistant has no backup chain; the lead reverts to the full pool and
      // the coordinator (already notified) assigns another second nurse.
      await this.repriceCaseAssignments(assignment.subscriptionId);
      await this.notifyAssistantLapsed(assignment.subscriptionId);
    } else {
      // Declining a primary/backup offer immediately escalates to the next nurse.
      await this.activateNext(assignment.subscriptionId);
    }

    return { id: assignment.id, status: AssignmentStatus.DECLINED };
  }

  // ── Full-time cases: second (assistant) nurse ─────────────────────────────

  /**
   * The accepted lead nurse on a full-time case (Extended Assist / Live-In)
   * flags that they need a second nurse to share the rotation. Sets
   * needsAssistant on the case and alerts the coordinator, who assigns one.
   */
  async requestAssistant(userId: string, assignmentId: string) {
    const caregiverId = await this.caregiverIdFor(userId);
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { subscription: { include: { careRecipient: true } } },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.caregiverId !== caregiverId) {
      throw new ForbiddenException('This assignment is not yours');
    }
    if (assignment.status !== AssignmentStatus.ACCEPTED) {
      throw new BadRequestException(
        'Only the accepted nurse can request a second nurse',
      );
    }
    const sub = assignment.subscription;
    if (SHORT_VISIT_PACKAGES.has(sub.packageType)) {
      throw new BadRequestException(
        'A second nurse only applies to full-time packages',
      );
    }

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { needsAssistant: true },
    });

    if (sub.coordinatorId) {
      await this.notifications.notify({
        userId: sub.coordinatorId,
        type: NotificationType.GENERAL,
        title: 'Second nurse requested',
        body: `The lead nurse for ${sub.careRecipient.name} has asked for a second nurse to share the rotation.`,
      });
    }

    return { subscriptionId: sub.id, needsAssistant: true };
  }

  /**
   * Coordinator brings a second nurse onto a full-time case. Offers the
   * ASSISTANT role to the best eligible nurse (same rules as matching, excluding
   * everyone already on the case) with the usual 5-minute clock.
   */
  async matchAssistant(coordinatorUserId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { careRecipient: true, assignments: true },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.coordinatorId !== coordinatorUserId) {
      throw new ForbiddenException('This case is not yours to coordinate');
    }
    if (!subscription.needsAssistant) {
      throw new BadRequestException(
        'This case has not requested a second nurse',
      );
    }
    const liveAssistant = subscription.assignments.find(
      (a) =>
        a.role === AssignmentRole.ASSISTANT &&
        (a.status === AssignmentStatus.OFFERED ||
          a.status === AssignmentStatus.ACCEPTED),
    );
    if (liveAssistant) {
      throw new BadRequestException(
        'A second nurse is already offered or assigned',
      );
    }

    const pkg = await this.prisma.package.findUnique({
      where: { type: subscription.packageType },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    // Exclude everyone already tied to this case (lead, backups, past assistants).
    const exclude = [
      ...new Set(subscription.assignments.map((a) => a.caregiverId)),
    ];
    const ranked = await this.rankedEligibleCaregivers(subscription, exclude);
    if (ranked.length === 0) {
      throw new BadRequestException(
        'No other nurse is available to assist right now',
      );
    }
    const pick = ranked[0];

    await this.prisma.$transaction(async (tx) => {
      // Clear any spent (declined/replaced) assistant so the unique
      // [subscription, role] slot is free.
      await tx.assignment.deleteMany({
        where: { subscriptionId, role: AssignmentRole.ASSISTANT },
      });
      await tx.assignment.create({
        data: {
          subscriptionId,
          caregiverId: pick.id,
          role: AssignmentRole.ASSISTANT,
          expiresAt: new Date(Date.now() + OFFER_WINDOW_MS),
        },
      });
    });

    // Two nurses now share the case, so split the nurse pool equally.
    await this.repriceCaseAssignments(subscriptionId);

    await this.notifications.notify({
      userId: pick.userId,
      type: NotificationType.ASSIGNMENT_OFFER,
      title: 'Assistant nurse offer',
      body: `You've been offered the assistant nurse role for ${subscription.careRecipient.name}. You have 5 minutes to accept.`,
    });

    return {
      subscriptionId,
      caregiverId: pick.id,
      role: AssignmentRole.ASSISTANT,
    };
  }

  /**
   * Set each nurse's monthly payout on a case: the 60% nurse pool goes to the
   * lead alone, or splits equally when a second (assistant) nurse is offered or
   * on board. Declined/replaced offers are ignored.
   */
  async repriceCaseAssignments(subscriptionId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { priceGhs: true },
    });
    if (!sub) return;

    const liveWhere = {
      subscriptionId,
      status: {
        notIn: [AssignmentStatus.DECLINED, AssignmentStatus.REPLACED],
      },
    } satisfies Prisma.AssignmentWhereInput;

    const assignments = await this.prisma.assignment.findMany({
      where: liveWhere,
      select: { role: true },
    });
    const hasAssistant = assignments.some(
      (a) => a.role === AssignmentRole.ASSISTANT,
    );
    const share = Math.round(
      (sub.priceGhs.toNumber() * NURSE_POOL_FRACTION) / (hasAssistant ? 2 : 1),
    );

    await this.prisma.assignment.updateMany({
      where: liveWhere,
      data: { payoutGhs: share },
    });
  }

  // ── Response shaping ──────────────────────────────────────────────────────

  private async withPackages(assignments: OfferAssignment[]) {
    const packages = await this.prisma.package.findMany();
    const byType = new Map<string, Package>(packages.map((p) => [p.type, p]));
    return assignments.map((a) =>
      this.buildOffer(a, byType.get(a.subscription.packageType) ?? null),
    );
  }

  private buildOffer(a: OfferAssignment, pkg: Package | null) {
    const sub = a.subscription;
    const client = sub.careRecipient;
    const spec = PACKAGE_SCHEDULE[sub.packageType];
    // Nurse pay from this case: the full 60% pool solo, or half of it when the
    // rotation is shared with a second nurse. Shown so the nurse sees both.
    const price = sub.priceGhs.toNumber();
    const soloPayoutGhs = Math.round(price * NURSE_POOL_FRACTION);
    const sharedPayoutGhs = Math.round((price * NURSE_POOL_FRACTION) / 2);
    return {
      id: a.id,
      role: a.role,
      status: a.status,
      packageType: sub.packageType,
      packageName: pkg?.name ?? null,
      schedule: pkg?.tagline ?? null,
      inclusions: pkg?.inclusions ?? [],
      // Daily commitment, so the nurse knows what they're accepting. Every care
      // visit starts in the morning (8:00 AM policy) for this many hours.
      visitDurationHrs: spec.durationHrs,
      visitsPerCycle: spec.count,
      payoutGhs: a.payoutGhs ? a.payoutGhs.toNumber() : null,
      soloPayoutGhs,
      sharedPayoutGhs,
      offeredAt: a.offeredAt,
      expiresAt: a.expiresAt,
      startDate: sub.careStartAt,
      coordinatorName: sub.coordinator
        ? `${sub.coordinator.firstName} ${sub.coordinator.lastName}`
        : null,
      // The family (account holder) the nurse will be serving.
      family: {
        name: `${sub.family.user.firstName} ${sub.family.user.lastName}`,
        phone: sub.family.user.phone,
        photoUrl: sub.family.photoUrl,
      },
      client: {
        name: client.name,
        initials: initialsOf(client.name),
        age: client.age,
        gender: client.gender,
        area: client.area,
        city: client.city,
        conditions: client.conditions,
        basicCareNeeds: client.basicCareNeeds,
      },
    };
  }
}
