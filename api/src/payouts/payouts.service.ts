import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PayoutStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Admin: payout requests, newest first (optionally filtered by status). */
  async list(status?: PayoutStatus) {
    const payouts = await this.prisma.payoutRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { requestedAt: 'desc' },
      include: {
        caregiver: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
        payment: {
          select: {
            billingPeriodStart: true,
            billingPeriodEnd: true,
            subscription: {
              select: { careRecipient: { select: { name: true } } },
            },
          },
        },
      },
    });

    return payouts.map((p) => ({
      id: p.id,
      status: p.status,
      amountGhs: p.amountGhs.toNumber(),
      requestedAt: p.requestedAt.toISOString(),
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      nurseName: `${p.caregiver.user.firstName} ${p.caregiver.user.lastName}`,
      nursePhone: p.caregiver.user.phone,
      recipientName: p.payment.subscription.careRecipient.name,
      billingPeriodStart: p.payment.billingPeriodStart.toISOString(),
      billingPeriodEnd: p.payment.billingPeriodEnd.toISOString(),
    }));
  }

  /** Admin: mark a payout as disbursed. */
  async markPaid(id: string) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id },
    });
    if (!payout) throw new NotFoundException('Payout request not found');
    if (payout.status === PayoutStatus.PAID) {
      throw new BadRequestException('This payout is already marked as paid.');
    }

    const updated = await this.prisma.payoutRequest.update({
      where: { id },
      data: { status: PayoutStatus.PAID, paidAt: new Date() },
    });
    return {
      id: updated.id,
      status: updated.status,
      paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
    };
  }

  // ── Coordinator payouts (their 8% fee per completed month) ──────────────────

  /** Admin: coordinator payout requests, newest first (optionally by status). */
  async listCoordinator(status?: PayoutStatus) {
    const payouts = await this.prisma.coordinatorPayoutRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { requestedAt: 'desc' },
      include: {
        coordinator: {
          select: { firstName: true, lastName: true, phone: true },
        },
        payment: {
          select: {
            billingPeriodStart: true,
            billingPeriodEnd: true,
            subscription: {
              select: { careRecipient: { select: { name: true } } },
            },
          },
        },
      },
    });

    return payouts.map((p) => ({
      id: p.id,
      status: p.status,
      amountGhs: p.amountGhs.toNumber(),
      requestedAt: p.requestedAt.toISOString(),
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      coordinatorName: `${p.coordinator.firstName} ${p.coordinator.lastName}`,
      coordinatorPhone: p.coordinator.phone,
      recipientName: p.payment.subscription.careRecipient.name,
      billingPeriodStart: p.payment.billingPeriodStart.toISOString(),
      billingPeriodEnd: p.payment.billingPeriodEnd.toISOString(),
    }));
  }

  /** Admin: mark a coordinator payout as disbursed. */
  async markCoordinatorPaid(id: string) {
    const payout = await this.prisma.coordinatorPayoutRequest.findUnique({
      where: { id },
    });
    if (!payout) throw new NotFoundException('Payout request not found');
    if (payout.status === PayoutStatus.PAID) {
      throw new BadRequestException('This payout is already marked as paid.');
    }

    const updated = await this.prisma.coordinatorPayoutRequest.update({
      where: { id },
      data: { status: PayoutStatus.PAID, paidAt: new Date() },
    });
    return {
      id: updated.id,
      status: updated.status,
      paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
    };
  }
}
