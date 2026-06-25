import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CareRecipient,
  Subscription,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';

type SubscriptionWithRecipient = Subscription & {
  careRecipient: CareRecipient;
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

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
    // end up with one without the other. Status defaults to MATCHING; the
    // payment gate is added in 5.5.
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
