import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CoordinatorProfile,
  PaymentStatus,
  PayoutStatus,
  Prisma,
  Role,
  User,
} from '@prisma/client';
import { coordinatorFeeGhs } from '../common/economics';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCoordinatorDto } from './dto/update-coordinator.dto';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

type EarningsPeriodId = 'month' | 'all';

// One month of coordinator earnings from a case they coordinate. For each
// billing period the family pays, the coordinator earns their 8% fee. Lifecycle
// mirrors the nurse's: pending → available → requested → paid.
type EarningStatus = 'pending' | 'available' | 'requested' | 'paid';
type Earning = {
  id: string; // the payment (subscription month) id
  subscriptionId: string;
  date: Date;
  patientName: string;
  service: string;
  amountGhs: number;
  status: EarningStatus;
};

@Injectable()
export class CoordinatorsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The coordinator's own personal + professional details. */
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.CARE_COORDINATOR) {
      throw new NotFoundException('Coordinator profile not found');
    }
    const profile = await this.ensureProfile(userId);
    return this.toProfile(user, profile);
  }

  /** Update editable details. Name + phone + photo live on the User; the rest
   * (gender, DOB, address, experience, bio, workplace) on CoordinatorProfile. */
  async updateMe(userId: string, dto: UpdateCoordinatorDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser || existingUser.role !== Role.CARE_COORDINATOR) {
      throw new NotFoundException('Coordinator profile not found');
    }
    await this.ensureProfile(userId);

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
        },
      });

      const profile = await this.prisma.coordinatorProfile.update({
        where: { userId },
        data: {
          ...(dto.gender !== undefined && { gender: dto.gender }),
          ...(dto.dateOfBirth !== undefined && {
            dateOfBirth: new Date(dto.dateOfBirth),
          }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.lat !== undefined && { lat: dto.lat }),
          ...(dto.lng !== undefined && { lng: dto.lng }),
          ...(dto.yearsExperience !== undefined && {
            yearsExperience: dto.yearsExperience,
          }),
          ...(dto.bio !== undefined && { bio: dto.bio }),
          ...(dto.workplace !== undefined && { workplace: dto.workplace }),
        },
      });

      return this.toProfile(user, profile);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'That phone number is already in use by another account',
        );
      }
      throw err;
    }
  }

  /**
   * The coordinator's earnings under the subscription model. For each billing
   * month a family pays, the coordinator earns their 8% fee on that case. See
   * EarningStatus for the per-month lifecycle.
   */
  async earnings(userId: string) {
    const earningsList = await this.collectEarnings(userId);

    const now = new Date();
    const periods = (['month', 'all'] as EarningsPeriodId[]).map((id) =>
      this.buildEarningsPeriod(id, earningsList, now),
    );

    const sumBy = (status: EarningStatus) =>
      Math.round(
        earningsList
          .filter((e) => e.status === status)
          .reduce((sum, e) => sum + e.amountGhs, 0),
      );

    return {
      availableGhs: sumBy('available'), // withdrawable now
      requestedGhs: sumBy('requested'), // awaiting admin disbursement
      paidOutGhs: sumBy('paid'), // disbursed all-time
      activeCases: new Set(earningsList.map((e) => e.subscriptionId)).size,
      periods,
      recentTransactions: earningsList.slice(0, 12).map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        patientName: e.patientName,
        service: e.service,
        amountGhs: e.amountGhs,
        status: e.status,
      })),
    };
  }

  /**
   * Request payout for every subscription month that is now available (the
   * family has paid and it hasn't been requested yet), including earlier months
   * the coordinator never withdrew. One record per month so an admin can
   * disburse and mark them individually.
   */
  async requestPayout(userId: string) {
    const earningsList = await this.collectEarnings(userId);
    const available = earningsList.filter((e) => e.status === 'available');

    if (available.length === 0) {
      throw new BadRequestException(
        'No earnings are available to withdraw yet. Payouts unlock once the ' +
          'family has paid for the subscription month.',
      );
    }

    // Security guard: only ever create a payout for a month the family has
    // actually paid. Re-verify each payment is SUCCESS at write time, so a
    // stale read can never turn into a payout against an unpaid invoice. The
    // request carries no client-supplied amount or payment id — the server
    // derives everything from this coordinator's own paid cases.
    const eligible = await this.eligiblePaidEarnings(available);
    if (eligible.length === 0) {
      throw new BadRequestException(
        'These earnings are no longer eligible for payout.',
      );
    }

    await this.prisma.coordinatorPayoutRequest.createMany({
      data: eligible.map((e) => ({
        coordinatorId: userId,
        paymentId: e.id,
        amountGhs: e.amountGhs,
      })),
      skipDuplicates: true,
    });

    return {
      count: eligible.length,
      totalGhs: Math.round(eligible.reduce((s, e) => s + e.amountGhs, 0)),
    };
  }

  /** Keep only earnings whose payment is confirmed SUCCESS (family paid). */
  private async eligiblePaidEarnings(earnings: Earning[]): Promise<Earning[]> {
    if (earnings.length === 0) return [];
    const paid = await this.prisma.payment.findMany({
      where: {
        id: { in: earnings.map((e) => e.id) },
        status: PaymentStatus.SUCCESS,
      },
      select: { id: true },
    });
    const paidIds = new Set(paid.map((p) => p.id));
    return earnings.filter((e) => paidIds.has(e.id));
  }

  /** Build the coordinator's monthly earnings from their cases' payments. */
  private async collectEarnings(coordinatorUserId: string): Promise<Earning[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { coordinatorId: coordinatorUserId },
      include: { careRecipient: { select: { name: true } } },
    });
    if (subscriptions.length === 0) return [];

    const subById = new Map(subscriptions.map((s) => [s.id, s]));
    const [payments, packages, payouts] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          subscriptionId: { in: [...subById.keys()] },
          status: { in: [PaymentStatus.SUCCESS, PaymentStatus.PENDING] },
        },
        orderBy: { billingPeriodStart: 'desc' },
      }),
      this.prisma.package.findMany({ select: { type: true, name: true } }),
      this.prisma.coordinatorPayoutRequest.findMany({
        where: { coordinatorId: coordinatorUserId },
        select: { paymentId: true, status: true },
      }),
    ]);
    const nameByType = new Map(packages.map((p) => [p.type, p.name]));
    const payoutByPayment = new Map(
      payouts.map((r) => [r.paymentId, r.status]),
    );
    return payments.map((p) => {
      const s = subById.get(p.subscriptionId)!;
      const payout = payoutByPayment.get(p.id);

      // Withdrawable the moment the family has paid this month's invoice
      // (Payment SUCCESS). The coordinator never sees the family's payment
      // state — the payout simply unlocks; only admins reconcile it.
      let status: EarningStatus;
      if (payout === PayoutStatus.PAID) status = 'paid';
      else if (payout === PayoutStatus.PENDING) status = 'requested';
      else if (p.status === PaymentStatus.SUCCESS) status = 'available';
      else status = 'pending';

      return {
        id: p.id,
        subscriptionId: p.subscriptionId,
        date: p.paidAt ?? p.billingPeriodStart,
        patientName: s.careRecipient.name,
        service: nameByType.get(s.packageType) ?? 'Care plan',
        amountGhs: coordinatorFeeGhs(p.amount.toNumber()),
        status,
      };
    });
  }

  private buildEarningsPeriod(
    id: EarningsPeriodId,
    earnings: Earning[],
    now: Date,
  ): {
    id: EarningsPeriodId;
    totalGhs: number;
    plans: number;
    subtitle: string;
    chartTitle: string;
    bars: { label: string; amountGhs: number }[];
  } {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const inRange =
      id === 'month'
        ? (d: Date) => d >= monthStart && d < monthEnd
        : () => true;

    const scoped = earnings.filter((e) => inRange(e.date));
    const totalGhs = scoped.reduce((s, e) => s + e.amountGhs, 0);
    const plans = new Set(scoped.map((e) => e.subscriptionId)).size;

    // Monthly trend — the last 6 months (earnings are paid out monthly).
    const bars: { label: string; amountGhs: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const sum = earnings
        .filter((e) => e.date >= d && e.date < mEnd)
        .reduce((s, e) => s + e.amountGhs, 0);
      bars.push({ label: MONTHS[d.getMonth()], amountGhs: sum });
    }

    const planLabel = plans === 1 ? 'case' : 'cases';
    const subtitle =
      id === 'month'
        ? `${MONTHS[now.getMonth()]} ${now.getFullYear()} · ${plans} ${planLabel}`
        : `All time · ${plans} ${planLabel}`;

    return {
      id,
      totalGhs,
      plans,
      subtitle,
      chartTitle:
        id === 'month'
          ? 'Monthly earnings'
          : `Monthly earnings — ${now.getFullYear()}`,
      bars,
    };
  }

  /** Lazily create the profile row for coordinators registered before this
   * table existed, so first access always has a row to read/update. */
  private async ensureProfile(userId: string): Promise<CoordinatorProfile> {
    return this.prisma.coordinatorProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  private toProfile(user: User, profile: CoordinatorProfile) {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      photoUrl: user.photoUrl,
      memberSince: profile.createdAt,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth,
      address: profile.address,
      lat: profile.lat,
      lng: profile.lng,
      yearsExperience: profile.yearsExperience,
      bio: profile.bio,
      workplace: profile.workplace,
    };
  }
}
