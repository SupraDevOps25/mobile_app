import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShiftStatus, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const MAX_PROXIMITY_KM = 50;

@Injectable()
export class BackupPoolService {
  constructor(private readonly prisma: PrismaService) {}

  async getSuggestions(shiftId: string, userId: string) {
    // 1. Load the cancelled shift with family location
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { family: true },
    });

    if (!shift) throw new NotFoundException('Shift not found');

    if (shift.status !== ShiftStatus.CANCELLED) {
      throw new BadRequestException(
        'Backup suggestions are only available for cancelled shifts',
      );
    }

    if (shift.family.userId !== userId) {
      throw new ForbiddenException('This shift does not belong to you');
    }

    // 2. Find eligible caregivers: verified, matching care type, free slot covering the shift window
    const eligibleCaregivers = await this.prisma.caregiverProfile.findMany({
      where: {
        id: { not: shift.caregiverId },
        verificationStatus: VerificationStatus.VERIFIED,
        careTypes: { has: shift.careType },
        availabilitySlots: {
          some: {
            isBooked: false,
            startTime: { lte: shift.startTime },
            endTime: { gte: shift.endTime },
          },
        },
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, phone: true },
        },
        availabilitySlots: {
          where: {
            isBooked: false,
            startTime: { lte: shift.startTime },
            endTime: { gte: shift.endTime },
          },
          take: 1,
        },
      },
    });

    // 3. Score each caregiver
    const scored = eligibleCaregivers.map((caregiver) => {
      const proximityScore = this.calculateProximityScore(
        shift.family.lat,
        shift.family.lng,
        caregiver.lat,
        caregiver.lng,
      );
      const ratingScore = parseFloat(caregiver.rating.toString()) / 5;
      // careTypeScore is always 1.0 — we already filtered for it
      const score = proximityScore * 0.4 + ratingScore * 0.4 + 0.2;

      return { caregiver, score };
    });

    // 4. Sort best score first
    scored.sort((a, b) => b.score - a.score);

    // 5. Persist suggestions so they can be retrieved without re-computing
    await Promise.all(
      scored.map(({ caregiver, score }, index) =>
        this.prisma.backupSuggestion.upsert({
          where: {
            shiftId_caregiverId: { shiftId, caregiverId: caregiver.id },
          },
          create: {
            shiftId,
            caregiverId: caregiver.id,
            rank: index + 1,
            score,
          },
          update: { rank: index + 1, score },
        }),
      ),
    );

    // 6. Return a clean response the mobile can render directly
    return scored.map(({ caregiver, score }, index) => ({
      rank: index + 1,
      score: Math.round(score * 100) / 100,
      availableSlot: caregiver.availabilitySlots[0] ?? null,
      caregiver: {
        id: caregiver.id,
        firstName: caregiver.user.firstName,
        lastName: caregiver.user.lastName,
        phone: caregiver.user.phone,
        bio: caregiver.bio,
        careTypes: caregiver.careTypes,
        hourlyRate: caregiver.hourlyRate,
        rating: caregiver.rating,
      },
    }));
  }

  // ─── Scoring helpers ──────────────────────────────────────────────────────

  private calculateProximityScore(
    familyLat: number | null,
    familyLng: number | null,
    caregiverLat: number | null,
    caregiverLng: number | null,
  ): number {
    if (!familyLat || !familyLng || !caregiverLat || !caregiverLng) {
      return 0.5; // neutral when location data is missing
    }
    const distanceKm = this.haversineDistance(
      familyLat,
      familyLng,
      caregiverLat,
      caregiverLng,
    );
    return Math.max(0, 1 - distanceKm / MAX_PROXIMITY_KM);
  }

  private haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
