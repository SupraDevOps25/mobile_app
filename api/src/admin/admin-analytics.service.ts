import { Injectable } from '@nestjs/common';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Time-series + distribution aggregates for the admin analytics page.
@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const now = new Date();
    // Last 6 months, oldest first.
    const months: Date[] = [];
    for (let i = 5; i >= 0; i--) {
      months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }
    const rangeStart = months[0];
    const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
    const label = (d: Date) => d.toLocaleString('en-US', { month: 'short' });

    const [subs, payments, subByStatus, cgByStatus, pkgDist] =
      await Promise.all([
        this.prisma.subscription.findMany({
          where: { createdAt: { gte: rangeStart } },
          select: { createdAt: true },
        }),
        this.prisma.payment.findMany({
          where: {
            status: PaymentStatus.SUCCESS,
            paidAt: { gte: rangeStart },
          },
          select: { paidAt: true, amount: true },
        }),
        this.prisma.subscription.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.caregiverProfile.groupBy({
          by: ['verificationStatus'],
          _count: { _all: true },
        }),
        this.prisma.subscription.groupBy({
          by: ['packageType'],
          _count: { _all: true },
          where: { status: { not: SubscriptionStatus.CANCELLED } },
        }),
      ]);

    const bookingBuckets = new Map(months.map((m) => [key(m), 0]));
    for (const s of subs) {
      const k = key(new Date(s.createdAt));
      if (bookingBuckets.has(k))
        bookingBuckets.set(k, (bookingBuckets.get(k) ?? 0) + 1);
    }

    const revenueBuckets = new Map(months.map((m) => [key(m), 0]));
    for (const p of payments) {
      if (!p.paidAt) continue;
      const k = key(new Date(p.paidAt));
      if (revenueBuckets.has(k))
        revenueBuckets.set(
          k,
          (revenueBuckets.get(k) ?? 0) + p.amount.toNumber(),
        );
    }

    return {
      monthlyBookings: months.map((m) => ({
        label: label(m),
        value: bookingBuckets.get(key(m)) ?? 0,
      })),
      monthlyRevenue: months.map((m) => ({
        label: label(m),
        value: Math.round(revenueBuckets.get(key(m)) ?? 0),
      })),
      subscriptionsByStatus: subByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      caregiversByStatus: cgByStatus.map((r) => ({
        status: r.verificationStatus,
        count: r._count._all,
      })),
      packageDistribution: pkgDist.map((r) => ({
        packageType: r.packageType,
        count: r._count._all,
      })),
    };
  }
}
