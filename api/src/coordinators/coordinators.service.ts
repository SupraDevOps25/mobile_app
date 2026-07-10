import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoordinatorProfile, Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCoordinatorDto } from './dto/update-coordinator.dto';

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
