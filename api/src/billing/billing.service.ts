import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  NotificationType,
  Payment,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
} from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';

type PaymentWithContext = Prisma.PaymentGetPayload<{
  include: { subscription: true; family: true };
}>;

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

function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
  ) {}

  // ── Coordinator: issue the month-end invoice ──────────────────────────────

  async issueInvoice(coordinatorUserId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        careRecipient: true,
        family: { include: { user: true } },
        payments: { orderBy: { billingPeriodEnd: 'desc' }, take: 1 },
      },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.coordinatorId !== coordinatorUserId) {
      throw new ForbiddenException('This case is not yours to coordinate');
    }
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Care must be active to issue an invoice');
    }

    // One open invoice at a time.
    const open = await this.prisma.payment.findFirst({
      where: { subscriptionId, status: PaymentStatus.PENDING },
    });
    if (open) {
      throw new BadRequestException(
        'There is already an unpaid invoice for this subscription',
      );
    }

    // The new period starts where the last one ended (or at activation).
    const last = subscription.payments[0];
    const start =
      last?.billingPeriodEnd ??
      subscription.activatedAt ??
      subscription.startedAt;
    const end = addMonths(start, 1);

    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId,
        familyId: subscription.familyId,
        amount: subscription.priceGhs,
        currency: 'GHS',
        billingPeriodStart: start,
        billingPeriodEnd: end,
      },
    });

    const label = `${fmtDate(start)} – ${fmtDate(end)}`;
    const amount = subscription.priceGhs.toNumber();

    await this.mail.sendInvoiceEmail(subscription.family.user.email, {
      recipientName: subscription.careRecipient.name,
      amountGhs: amount,
      periodLabel: label,
    });
    await this.notifications.notify({
      userId: subscription.family.userId,
      type: NotificationType.GENERAL,
      title: 'New invoice',
      body: `Your invoice for ${label} (GHS ${amount.toLocaleString()}) is ready. Log in to pay.`,
    });

    return this.toInvoice(payment);
  }

  // ── Family: view + pay invoices ───────────────────────────────────────────

  async listInvoices(userId: string) {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
    });
    if (!family) throw new NotFoundException('Family profile not found');

    const payments = await this.prisma.payment.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((p) => this.toInvoice(p));
  }

  /** Initialize a Paystack transaction for an invoice. */
  async pay(userId: string, paymentId: string) {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!family) throw new NotFoundException('Family profile not found');

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.familyId !== family.id) {
      throw new NotFoundException('Invoice not found');
    }
    if (payment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('This invoice has already been paid');
    }

    const reference = `INV-${payment.id.slice(0, 8)}-${Date.now()}`;
    const init = await this.paystack.initializeTransaction({
      email: family.user.email,
      amountGhs: payment.amount.toNumber(),
      reference,
    });

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PENDING,
        paystackReference: init.reference,
        paystackAccessCode: init.accessCode,
        paystackAuthUrl: init.authorizationUrl,
      },
    });

    return {
      paymentId: updated.id,
      authorizationUrl: init.authorizationUrl,
      reference: init.reference,
      amount: payment.amount.toNumber(),
    };
  }

  /** Verify a transaction after the Paystack callback (server-side). */
  async verify(reference: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { paystackReference: reference },
      include: { subscription: true, family: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === PaymentStatus.SUCCESS) {
      return { status: PaymentStatus.SUCCESS, reference };
    }

    const result = await this.paystack.verifyTransaction(reference);
    if (result.status === 'success') {
      // Never settle an invoice unless the amount paid matches what we billed.
      if (result.amount !== this.expectedPesewas(payment)) {
        this.logger.warn(
          `Amount mismatch on ${reference}: paid ${result.amount}, expected ${this.expectedPesewas(payment)}`,
        );
        throw new BadRequestException('Paid amount does not match the invoice');
      }
      await this.markPaid(payment);
      return { status: PaymentStatus.SUCCESS, reference };
    }

    const status =
      result.status === 'abandoned'
        ? PaymentStatus.ABANDONED
        : PaymentStatus.FAILED;
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status },
    });
    await this.notifications.notify({
      userId: payment.family.userId,
      type: NotificationType.PAYMENT_FAILED,
      title: 'Payment failed',
      body: 'Your payment could not be completed. Please try again.',
    });
    return { status, reference };
  }

  /** Paystack webhook — verified server-side, independent of the callback. */
  async handleWebhook(signature: string | undefined, rawBody: Buffer) {
    if (!this.paystack.verifyWebhookSignature(signature, rawBody)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    const event = JSON.parse(rawBody.toString()) as {
      event: string;
      data: { reference: string; amount?: number };
    };

    if (event.event === 'charge.success') {
      const payment = await this.prisma.payment.findUnique({
        where: { paystackReference: event.data.reference },
        include: { subscription: true, family: true },
      });
      if (payment && payment.status !== PaymentStatus.SUCCESS) {
        // Only settle if the charged amount matches the invoice.
        if (event.data.amount === this.expectedPesewas(payment)) {
          await this.markPaid(payment);
        } else {
          this.logger.warn(
            `Webhook amount mismatch on ${event.data.reference}: charged ${event.data.amount}, expected ${this.expectedPesewas(payment)}`,
          );
        }
      }
    }
    return { received: true };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Invoice amount in pesewas (GHS × 100), matching Paystack's unit. */
  private expectedPesewas(payment: PaymentWithContext): number {
    return Math.round(payment.amount.toNumber() * 100);
  }

  private async markPaid(payment: PaymentWithContext) {
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.SUCCESS, paidAt: new Date() },
      });
      // Do NOT auto-renew. The month is settled; move to RENEWING so the
      // family is asked whether to continue with the same package.
      await tx.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: SubscriptionStatus.RENEWING },
      });
    });

    await this.notifications.notify({
      userId: payment.family.userId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Payment received',
      body: `Thank you — your payment of GHS ${payment.amount.toNumber().toLocaleString()} was received.`,
    });
    await this.notifications.notify({
      userId: payment.family.userId,
      type: NotificationType.GENERAL,
      title: 'Renew your care package?',
      body: 'Your care month is complete. Open the app to renew the same package or end the service.',
    });
    this.logger.log(`Invoice ${payment.id} marked paid`);
  }

  private toInvoice(p: Payment) {
    return {
      id: p.id,
      status: p.status,
      amount: p.amount.toNumber(),
      currency: p.currency,
      billingPeriodStart: p.billingPeriodStart,
      billingPeriodEnd: p.billingPeriodEnd,
      paidAt: p.paidAt,
      authorizationUrl: p.paystackAuthUrl,
      reference: p.paystackReference,
      createdAt: p.createdAt,
    };
  }
}
