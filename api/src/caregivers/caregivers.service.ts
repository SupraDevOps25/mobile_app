import { Injectable, NotFoundException } from '@nestjs/common';
import { CaregiverProfile } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

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

  async setSchedule(userId: string, schedule: UpdateScheduleDto) {
    const profile = await this.prisma.caregiverProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Caregiver profile not found');

    const updated = await this.prisma.caregiverProfile.update({
      where: { userId },
      data: {
        // De-duplicate and sort the weekdays so storage is canonical.
        workingDays: [...new Set(schedule.workingDays)].sort((a, b) => a - b),
        workStart: schedule.workStart,
        workEnd: schedule.workEnd,
        maxVisitsPerDay: schedule.maxVisitsPerDay,
      },
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
      workingDays: p.workingDays,
      workStart: p.workStart,
      workEnd: p.workEnd,
      maxVisitsPerDay: p.maxVisitsPerDay,
      verificationStatus: p.verificationStatus,
      rating: p.rating.toNumber(),
      reliabilityScore: p.reliabilityScore,
      totalReviews: p.totalReviews,
    };
  }
}
