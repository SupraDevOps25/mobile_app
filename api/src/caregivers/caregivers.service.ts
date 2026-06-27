import { Injectable, NotFoundException } from '@nestjs/common';
import { CaregiverProfile } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CaregiversService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const profile = await this.prisma.caregiverProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Caregiver profile not found');
    return this.toResponse(profile);
  }

  async setAvailability(userId: string, isAvailable: boolean) {
    const profile = await this.prisma.caregiverProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Caregiver profile not found');

    const updated = await this.prisma.caregiverProfile.update({
      where: { userId },
      data: { isAvailable },
    });
    return this.toResponse(updated);
  }

  private toResponse(p: CaregiverProfile) {
    return {
      id: p.id,
      qualification: p.qualification,
      bio: p.bio,
      yearsExperience: p.yearsExperience,
      competencies: p.competencies,
      serviceAreas: p.serviceAreas,
      licenseVerified: p.licenseVerified,
      isAvailable: p.isAvailable,
      verificationStatus: p.verificationStatus,
      rating: p.rating.toNumber(),
      reliabilityScore: p.reliabilityScore,
      totalReviews: p.totalReviews,
    };
  }
}
