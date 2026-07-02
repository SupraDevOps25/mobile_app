import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  PaymentMethod,
  Prisma,
  SavedAddress,
  User,
} from '@prisma/client';
import { PaystackService } from '../billing/paystack.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/save-address.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

@Injectable()
export class FamilyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
  ) {}

  /** The family's own personal details. */
  async me(userId: string) {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!family) throw new NotFoundException('Family profile not found');
    return this.toProfile(family.user, family.createdAt);
  }

  /** Update editable personal details (name + phone). Email is the login
   * identity and stays read-only here. */
  async updateMe(userId: string, dto: UpdateFamilyDto) {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
    });
    if (!family) throw new NotFoundException('Family profile not found');

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
        },
      });
      return this.toProfile(user, family.createdAt);
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

  private toProfile(user: User, memberSince: Date) {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      memberSince,
    };
  }

  /** Headline numbers for the family profile card. */
  async stats(userId: string) {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
    });
    if (!family) throw new NotFoundException('Family profile not found');

    const [carePlans, caregivers] = await Promise.all([
      // Every care plan the family has ever started (a "booking").
      this.prisma.subscription.count({ where: { familyId: family.id } }),
      // Distinct nurses who actually took a role on their care.
      this.prisma.assignment.findMany({
        where: {
          subscription: { familyId: family.id },
          status: {
            in: [AssignmentStatus.ACCEPTED, AssignmentStatus.ACTIVE],
          },
        },
        select: { caregiverId: true },
        distinct: ['caregiverId'],
      }),
    ]);

    return {
      memberSince: family.createdAt,
      carePlans,
      caregivers: caregivers.length,
    };
  }

  // ── Saved addresses ───────────────────────────────────────────────────────

  private async familyIdFor(userId: string): Promise<string> {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
    });
    if (!family) throw new NotFoundException('Family profile not found');
    return family.id;
  }

  async listAddresses(userId: string) {
    const familyId = await this.familyIdFor(userId);
    const addresses = await this.prisma.savedAddress.findMany({
      where: { familyId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return addresses.map((a) => this.toAddress(a));
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const familyId = await this.familyIdFor(userId);
    const count = await this.prisma.savedAddress.count({ where: { familyId } });
    // The first address is the default; honour an explicit default too.
    const makeDefault = dto.isDefault || count === 0;

    const created = await this.prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.savedAddress.updateMany({
          where: { familyId },
          data: { isDefault: false },
        });
      }
      return tx.savedAddress.create({
        data: {
          familyId,
          label: dto.label,
          address: dto.address,
          area: dto.area,
          city: dto.city,
          lat: dto.lat,
          lng: dto.lng,
          isDefault: makeDefault,
        },
      });
    });
    return this.toAddress(created);
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    const familyId = await this.familyIdFor(userId);
    const existing = await this.prisma.savedAddress.findUnique({
      where: { id },
    });
    if (!existing || existing.familyId !== familyId) {
      throw new NotFoundException('Address not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.savedAddress.updateMany({
          where: { familyId },
          data: { isDefault: false },
        });
      }
      return tx.savedAddress.update({
        where: { id },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.area !== undefined && { area: dto.area }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.lat !== undefined && { lat: dto.lat }),
          ...(dto.lng !== undefined && { lng: dto.lng }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      });
    });
    return this.toAddress(updated);
  }

  async deleteAddress(userId: string, id: string) {
    const familyId = await this.familyIdFor(userId);
    const existing = await this.prisma.savedAddress.findUnique({
      where: { id },
    });
    if (!existing || existing.familyId !== familyId) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.savedAddress.delete({ where: { id } });

    // If we removed the default, promote the next address to default.
    if (existing.isDefault) {
      const next = await this.prisma.savedAddress.findFirst({
        where: { familyId },
        orderBy: { createdAt: 'asc' },
      });
      if (next) {
        await this.prisma.savedAddress.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
    return { id };
  }

  private toAddress(a: SavedAddress) {
    return {
      id: a.id,
      label: a.label,
      address: a.address,
      area: a.area,
      city: a.city,
      lat: a.lat,
      lng: a.lng,
      isDefault: a.isDefault,
    };
  }

  // ── Payment methods (saved Paystack authorizations) ───────────────────────

  async listPaymentMethods(userId: string) {
    const familyId = await this.familyIdFor(userId);
    const methods = await this.prisma.paymentMethod.findMany({
      where: { familyId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return methods.map((m) => this.toPaymentMethod(m));
  }

  async setDefaultPaymentMethod(userId: string, id: string) {
    const familyId = await this.familyIdFor(userId);
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });
    if (!method || method.familyId !== familyId) {
      throw new NotFoundException('Payment method not found');
    }
    await this.prisma.$transaction([
      this.prisma.paymentMethod.updateMany({
        where: { familyId },
        data: { isDefault: false },
      }),
      this.prisma.paymentMethod.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);
    return { id, isDefault: true };
  }

  async deletePaymentMethod(userId: string, id: string) {
    const familyId = await this.familyIdFor(userId);
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });
    if (!method || method.familyId !== familyId) {
      throw new NotFoundException('Payment method not found');
    }

    // Revoke the token on Paystack (best-effort), then drop our record.
    await this.paystack.deactivateAuthorization(method.authorizationCode);
    await this.prisma.paymentMethod.delete({ where: { id } });

    // Promote another method to default if we removed the default one.
    if (method.isDefault) {
      const next = await this.prisma.paymentMethod.findFirst({
        where: { familyId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.paymentMethod.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
    return { id };
  }

  /** Client-safe shape — the authorizationCode token is never exposed. */
  private toPaymentMethod(m: PaymentMethod) {
    return {
      id: m.id,
      channel: m.channel,
      brand: m.brand,
      last4: m.last4,
      bank: m.bank,
      expMonth: m.expMonth,
      expYear: m.expYear,
      isDefault: m.isDefault,
    };
  }
}
