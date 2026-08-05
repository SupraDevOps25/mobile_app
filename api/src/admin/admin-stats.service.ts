import { Injectable } from '@nestjs/common';
import {
  PaymentStatus,
  Role,
  SubscriptionStatus,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Aggregates for the admin dashboard — headline metrics plus small "recent"
// lists. Kept to a handful of cheap queries.
@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      bookingsThisMonth,
      activeCaregivers,
      pendingApprovals,
      revenueAgg,
      families,
      caregivers,
      coordinators,
      activeSubscriptions,
      recent,
      pending,
    ] = await Promise.all([
      this.prisma.subscription.count({
        where: { createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      this.prisma.caregiverProfile.count({
        where: { verificationStatus: VerificationStatus.VERIFIED },
      }),
      this.prisma.caregiverProfile.count({
        where: { verificationStatus: VerificationStatus.PENDING_REVIEW },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: PaymentStatus.SUCCESS,
          paidAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      this.prisma.user.count({ where: { role: Role.FAMILY } }),
      this.prisma.user.count({ where: { role: Role.CAREGIVER } }),
      this.prisma.user.count({ where: { role: Role.CARE_COORDINATOR } }),
      this.prisma.subscription.count({
        where: { status: { not: SubscriptionStatus.CANCELLED } },
      }),
      this.prisma.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          careRecipient: { select: { name: true } },
          family: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      this.prisma.caregiverProfile.findMany({
        where: { verificationStatus: VerificationStatus.PENDING_REVIEW },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      bookingsThisMonth,
      activeCaregivers,
      pendingApprovals,
      revenueThisMonthGhs: revenueAgg._sum.amount?.toNumber() ?? 0,
      totals: { families, caregivers, coordinators, activeSubscriptions },
      recentBookings: recent.map((s) => ({
        id: s.id,
        recipientName: s.careRecipient.name,
        familyName:
          `${s.family.user.firstName} ${s.family.user.lastName}`.trim(),
        packageType: s.packageType,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      })),
      pendingCaregivers: pending.map((c) => ({
        id: c.id,
        name: `${c.user.firstName} ${c.user.lastName}`.trim(),
        submittedAt: c.updatedAt.toISOString(),
      })),
    };
  }
}
