import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  FamilyProfile,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  SavedAddress,
  SubscriptionStatus,
  User,
} from '@prisma/client';
import { PaystackService } from '../billing/paystack.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/save-address.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

// Minimal shape of a multer-uploaded file (avoids depending on @types/multer).
export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class FamilyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
    private readonly storage: CloudinaryService,
  ) {}

  /** The family's own personal details. */
  async me(userId: string) {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!family) throw new NotFoundException('Family profile not found');
    return this.toProfile(family.user, family);
  }

  /** Update editable personal details. Name + phone live on the User; the
   * account holder's own gender, date of birth and home location live on the
   * FamilyProfile. Email is the login identity and stays read-only here. */
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

      const touchesProfile =
        dto.gender !== undefined ||
        dto.dateOfBirth !== undefined ||
        dto.address !== undefined ||
        dto.lat !== undefined ||
        dto.lng !== undefined;
      const profile = touchesProfile
        ? await this.prisma.familyProfile.update({
            where: { userId },
            data: {
              ...(dto.gender !== undefined && { gender: dto.gender }),
              ...(dto.dateOfBirth !== undefined && {
                dateOfBirth: new Date(dto.dateOfBirth),
              }),
              ...(dto.address !== undefined && { address: dto.address }),
              ...(dto.lat !== undefined && { lat: dto.lat }),
              ...(dto.lng !== undefined && { lng: dto.lng }),
            },
          })
        : family;

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

  /** Upload / replace the family account holder's profile photo. */
  async uploadPhoto(userId: string, file: UploadedFile) {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!family) throw new NotFoundException('Family profile not found');
    this.assertImage(file);

    const stored = await this.storage.upload(file, {
      folder: `supracarer/families/${family.id}`,
      publicId: 'photo',
      resourceType: 'image',
    });

    const updated = await this.prisma.familyProfile.update({
      where: { userId },
      data: { photoUrl: stored.url, photoPublicId: stored.publicId },
    });
    return this.toProfile(family.user, updated);
  }

  private assertImage(file: UploadedFile | undefined) {
    if (!file) throw new BadRequestException('No file was uploaded.');
    if (file.size > MAX_PHOTO_BYTES) {
      throw new BadRequestException('Image is too large (max 5 MB).');
    }
    if (!ALLOWED_IMAGE.includes(file.mimetype)) {
      throw new BadRequestException('Upload a JPG, PNG or WebP image.');
    }
  }

  /**
   * Permanently delete the family's account and all their data. Blocked while
   * care is ongoing or an invoice is unpaid. Revokes saved Paystack tokens,
   * then removes records in FK-safe order before deleting the user (which
   * cascades the profile, recipients, addresses, methods and notifications).
   */
  async deleteAccount(userId: string) {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
      include: { paymentMethods: true },
    });
    if (!family) throw new NotFoundException('Family profile not found');

    const ongoing = await this.prisma.subscription.findFirst({
      where: {
        familyId: family.id,
        status: { not: SubscriptionStatus.CANCELLED },
      },
    });
    if (ongoing) {
      throw new BadRequestException(
        'Please end your active care plan before deleting your account.',
      );
    }

    const unpaid = await this.prisma.payment.findFirst({
      where: { familyId: family.id, status: PaymentStatus.PENDING },
    });
    if (unpaid) {
      throw new BadRequestException(
        'You have an unpaid invoice. Please settle it before deleting your account.',
      );
    }

    // Revoke saved payment tokens on Paystack (best-effort).
    for (const pm of family.paymentMethods) {
      await this.paystack.deactivateAuthorization(pm.authorizationCode);
    }

    await this.prisma.$transaction([
      // Payments block subscriptions (and the family) — remove them first.
      this.prisma.payment.deleteMany({ where: { familyId: family.id } }),
      // Subscriptions cascade to their assignments, visits and visit logs.
      this.prisma.subscription.deleteMany({ where: { familyId: family.id } }),
      // Deleting the user cascades the profile → recipients, addresses,
      // payment methods, plus notifications and email verifications.
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    return { deleted: true };
  }

  private toProfile(user: User, family: FamilyProfile) {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      memberSince: family.createdAt,
      gender: family.gender,
      dateOfBirth: family.dateOfBirth,
      address: family.address,
      lat: family.lat,
      lng: family.lng,
      photoUrl: family.photoUrl,
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
