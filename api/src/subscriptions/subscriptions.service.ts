import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  CareRecipient,
  NotificationType,
  PackageType,
  Subscription,
  SubscriptionStatus,
  VisitKind,
} from '@prisma/client';
import { AssignmentsService } from '../assignments/assignments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SetCareStartDto } from './dto/set-care-start.dto';
import { SubscribeDto } from './dto/subscribe.dto';

type SubscriptionWithRecipient = Subscription & {
  careRecipient: CareRecipient;
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Visit cadence per package — used to auto-generate the month's schedule when
// the coordinator activates care.
const PACKAGE_SCHEDULE: Record<
  PackageType,
  { count: number; durationHrs: number; intervalDays: number }
> = {
  WELLNESS: { count: 4, durationHrs: 2, intervalDays: 7 },
  DAILY_ASSIST: { count: 26, durationHrs: 8, intervalDays: 1 },
  EXTENDED_ASSIST: { count: 26, durationHrs: 12, intervalDays: 1 },
  LIVE_IN: { count: 30, durationHrs: 24, intervalDays: 1 },
};

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

    return subscription ? this.toResponse(subscription) : null;
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

    const lead = await this.leadAssignment(subscriptionId);
    if (!lead) throw new BadRequestException('No nurse has accepted this case');

    const visits = this.buildVisitSchedule(
      subscriptionId,
      subscription.packageType,
      lead,
      subscription.careStartAt,
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

  /** Family renews the same package for the next period (same care team). */
  async renew(userId: string, subscriptionId: string) {
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

    const lead = await this.leadAssignment(subscriptionId);
    if (!lead) throw new BadRequestException('This case has no assigned nurse');

    const periodStart = subscription.renewsAt ?? new Date();
    const visits = this.buildVisitSchedule(
      subscriptionId,
      subscription.packageType,
      lead,
      periodStart,
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

  // ── Shared helpers ────────────────────────────────────────────────────────

  private async leadAssignment(subscriptionId: string) {
    return this.prisma.assignment.findFirst({
      where: { subscriptionId, status: AssignmentStatus.ACCEPTED },
      select: { id: true, caregiverId: true },
    });
  }

  private buildVisitSchedule(
    subscriptionId: string,
    packageType: PackageType,
    lead: { id: string; caregiverId: string },
    startDate: Date,
  ) {
    const schedule = PACKAGE_SCHEDULE[packageType];
    return Array.from({ length: schedule.count }, (_, i) => {
      const scheduledFor = new Date(startDate);
      scheduledFor.setDate(scheduledFor.getDate() + i * schedule.intervalDays);
      return {
        subscriptionId,
        caregiverId: lead.caregiverId,
        assignmentId: lead.id,
        kind: VisitKind.CARE_VISIT,
        scheduledFor,
        durationHrs: schedule.durationHrs,
      };
    });
  }

  private toResponse(s: SubscriptionWithRecipient) {
    return {
      id: s.id,
      packageType: s.packageType,
      status: s.status,
      priceGhs: s.priceGhs.toNumber(),
      startedAt: s.startedAt,
      renewsAt: s.renewsAt,
      careStartAt: s.careStartAt,
      activatedAt: s.activatedAt,
      careRecipient: {
        id: s.careRecipient.id,
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
