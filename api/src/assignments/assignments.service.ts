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
  NotificationType,
  Package,
  Prisma,
  Role,
  SubscriptionStatus,
} from '@prisma/client';
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

const PAYOUT_FRACTION: Record<AssignmentRole, number> = {
  PRIMARY: 0.75,
  BACKUP_1: 0.15,
  BACKUP_2: 0.15,
};

const ROLE_LABEL: Record<AssignmentRole, string> = {
  PRIMARY: 'primary nurse',
  BACKUP_1: 'backup nurse #1',
  BACKUP_2: 'backup nurse #2',
};

type OfferAssignment = Prisma.AssignmentGetPayload<{
  include: {
    subscription: { include: { careRecipient: true; coordinator: true } };
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

  // ── System-triggered matching ─────────────────────────────────────────────

  /**
   * Runs automatically when a subscription needs a care team. Ranks eligible
   * nurses, creates Primary + Backup offers (only the Primary is "live" with a
   * 5-minute clock), attaches + notifies a coordinator.
   */
  async match(subscriptionId: string) {
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

    const eligible = await this.prisma.caregiverProfile.findMany({
      where: { licenseVerified: true, isAvailable: true },
    });
    if (eligible.length === 0) {
      throw new BadRequestException('No eligible caregivers are available');
    }

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

    const ranked = rankCaregivers(
      eligible.map((c) => ({
        id: c.id,
        yearsExperience: c.yearsExperience,
        reliabilityScore: c.reliabilityScore,
        serviceAreas: c.serviceAreas,
      })),
      { recipientArea: subscription.careRecipient.area, priorCaregiverIds },
    );

    const picks = ranked.slice(0, ROLES_IN_ORDER.length);
    const price = pkg.priceGhs.toNumber();
    const coordinatorId = await this.pickCoordinator();

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < picks.length; i++) {
        const role = ROLES_IN_ORDER[i];
        await tx.assignment.create({
          data: {
            subscriptionId,
            caregiverId: picks[i].id,
            role,
            payoutGhs: Math.round(price * PAYOUT_FRACTION[role]),
            // Only the primary is live initially; backups wait their turn.
            expiresAt:
              role === AssignmentRole.PRIMARY
                ? new Date(Date.now() + OFFER_WINDOW_MS)
                : null,
          },
        });
      }
      if (coordinatorId) {
        await tx.subscription.update({
          where: { id: subscriptionId },
          data: { coordinatorId },
        });
      }
    });

    // Notify the primary nurse (on the clock) and the coordinator.
    const primary = eligible.find((c) => c.id === picks[0].id);
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
      await this.activateNext(a.subscriptionId);
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
        subscription: { include: { careRecipient: true, coordinator: true } },
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
        subscription: { include: { careRecipient: true, coordinator: true } },
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
        subscription: { include: { careRecipient: true, coordinator: true } },
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
    await this.notifications.notify({
      userId: sub.family.userId,
      type: NotificationType.TEAM_ASSIGNED,
      title: 'Your care team is assigned',
      body: `A nurse has been assigned for ${sub.careRecipient.name}. Your Care Coordinator will be in touch.`,
    });

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

    // Declining immediately escalates to the next ranked nurse.
    await this.activateNext(assignment.subscriptionId);

    return { id: assignment.id, status: AssignmentStatus.DECLINED };
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
    return {
      id: a.id,
      role: a.role,
      status: a.status,
      packageType: sub.packageType,
      packageName: pkg?.name ?? null,
      schedule: pkg?.tagline ?? null,
      payoutGhs: a.payoutGhs ? a.payoutGhs.toNumber() : null,
      offeredAt: a.offeredAt,
      expiresAt: a.expiresAt,
      startDate: sub.careStartAt,
      coordinatorName: sub.coordinator
        ? `${sub.coordinator.firstName} ${sub.coordinator.lastName}`
        : null,
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
