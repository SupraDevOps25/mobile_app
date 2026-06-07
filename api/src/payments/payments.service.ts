import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, ShiftStatus } from '@prisma/client';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PaystackService } from './paystack.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly webhookSecret: string;
  private readonly callbackUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
    config: ConfigService,
  ) {
    this.webhookSecret = config.getOrThrow<string>('PAYSTACK_WEBHOOK_SECRET');
    this.callbackUrl = config.getOrThrow<string>('PAYSTACK_CALLBACK_URL');
  }

  async initialize(userId: string, dto: InitializePaymentDto) {
    // 1. Get the family profile for this user
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!family) throw new NotFoundException('Family profile not found');

    // 2. Get the shift with caregiver details
    const shift = await this.prisma.shift.findUnique({
      where: { id: dto.shiftId },
      include: { caregiver: true },
    });
    if (!shift) throw new NotFoundException('Shift not found');

    // 3. Only the family who booked this shift can pay
    if (shift.familyId !== family.id) {
      throw new ForbiddenException('This shift does not belong to you');
    }

    // 4. Payment only makes sense for confirmed shifts
    if (shift.status !== ShiftStatus.CONFIRMED) {
      throw new BadRequestException(
        'Payment can only be initialized for a CONFIRMED shift',
      );
    }

    // 5. Prevent double payment
    const existing = await this.prisma.payment.findUnique({
      where: { shiftId: shift.id },
    });
    if (existing && existing.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('This shift has already been paid for');
    }

    // 6. Calculate total: hourlyRate × shift duration in hours
    if (!shift.caregiver.hourlyRate) {
      throw new BadRequestException('Caregiver has not set an hourly rate yet');
    }
    const hourlyRate = parseFloat(shift.caregiver.hourlyRate.toString());
    const durationHours =
      (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
    const totalGHS = hourlyRate * durationHours;
    // Paystack requires amount in the smallest currency unit (pesewas for GHS)
    const amountInPesewas = Math.round(totalGHS * 100);

    // 7. Create or reuse a pending payment record
    const payment =
      existing ??
      (await this.prisma.payment.create({
        data: {
          shiftId: shift.id,
          familyId: family.id,
          amount: totalGHS,
          currency: 'GHS',
          status: PaymentStatus.PENDING,
        },
      }));

    // 8. Call Paystack to get the checkout URL
    const paystackData = await this.paystack.initializeTransaction({
      email: family.user.email,
      amount: amountInPesewas,
      reference: payment.id,
      callbackUrl: this.callbackUrl,
      metadata: {
        shiftId: shift.id,
        familyId: family.id,
        caregiverId: shift.caregiverId,
      },
    });

    // 9. Save Paystack reference and access code to the payment record
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        paystackReference: paystackData.reference,
        paystackAccessCode: paystackData.access_code,
        paystackAuthUrl: paystackData.authorization_url,
      },
    });

    return {
      paymentId: payment.id,
      amount: totalGHS,
      currency: 'GHS',
      authorizationUrl: paystackData.authorization_url,
      reference: paystackData.reference,
    };
  }

  async verify(userId: string, reference: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { paystackReference: reference },
      include: { family: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.family.userId !== userId) {
      throw new ForbiddenException('This payment does not belong to you');
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return payment;
    }

    const result = await this.paystack.verifyTransaction(reference);

    const newStatus =
      result.status === 'success'
        ? PaymentStatus.SUCCESS
        : PaymentStatus.FAILED;

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt: result.status === 'success' ? new Date(result.paid_at) : null,
      },
    });
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    // Verify the request is genuinely from Paystack using HMAC-SHA512
    const hash = createHmac('sha512', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString()) as {
      event: string;
      data: { reference: string; status: string; paid_at: string };
    };

    if (event.event !== 'charge.success') {
      // Acknowledge other events without processing them
      return { received: true };
    }

    const { reference, paid_at } = event.data;

    const payment = await this.prisma.payment.findUnique({
      where: { paystackReference: reference },
    });

    if (!payment) {
      this.logger.warn(`Webhook received for unknown reference: ${reference}`);
      return { received: true };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.SUCCESS, paidAt: new Date(paid_at) },
    });

    this.logger.log(`Payment ${payment.id} marked SUCCESS via webhook`);
    return { received: true };
  }

  async getPaymentByShift(shiftId: string, userId: string) {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
    });
    if (!family) throw new NotFoundException('Family profile not found');

    const payment = await this.prisma.payment.findUnique({
      where: { shiftId },
    });
    if (!payment)
      throw new NotFoundException('No payment found for this shift');

    if (payment.familyId !== family.id) {
      throw new ForbiddenException('This payment does not belong to you');
    }

    return payment;
  }
}
