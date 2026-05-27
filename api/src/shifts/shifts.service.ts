import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShiftStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CancelShiftDto } from './dto/cancel-shift.dto';
import { CreateShiftDto } from './dto/create-shift.dto';

const RESPONSE_DEADLINE_HOURS = 2;

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async requestShift(userId: string, dto: CreateShiftDto) {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
    });
    if (!family) throw new NotFoundException('Family profile not found');

    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: dto.availabilitySlotId },
    });
    if (!slot) throw new NotFoundException('Availability slot not found');
    if (slot.isBooked)
      throw new BadRequestException('This slot is already booked');

    const responseDeadline = new Date();
    responseDeadline.setHours(
      responseDeadline.getHours() + RESPONSE_DEADLINE_HOURS,
    );

    // Create shift and mark slot as booked atomically
    return this.prisma.$transaction(async (tx) => {
      const shift = await tx.shift.create({
        data: {
          familyId: family.id,
          caregiverId: slot.caregiverId,
          availabilitySlotId: slot.id,
          careType: dto.careType,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: ShiftStatus.PENDING,
          responseDeadline,
          notes: dto.notes,
        },
        include: shiftIncludes,
      });

      await tx.availabilitySlot.update({
        where: { id: slot.id },
        data: { isBooked: true },
      });

      return shift;
    });
  }

  async findAll(userId: string, role: string) {
    if (role === 'CAREGIVER') {
      const caregiver = await this.prisma.caregiverProfile.findUnique({
        where: { userId },
      });
      if (!caregiver)
        throw new NotFoundException('Caregiver profile not found');

      return this.prisma.shift.findMany({
        where: { caregiverId: caregiver.id },
        include: shiftIncludes,
        orderBy: { startTime: 'asc' },
      });
    }

    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
    });
    if (!family) throw new NotFoundException('Family profile not found');

    return this.prisma.shift.findMany({
      where: { familyId: family.id },
      include: shiftIncludes,
      orderBy: { startTime: 'asc' },
    });
  }

  async accept(shiftId: string, userId: string) {
    const shift = await this.getShiftOrThrow(shiftId);
    this.assertIsAssignedCaregiver(shift, userId);

    if (shift.status !== ShiftStatus.PENDING) {
      throw new BadRequestException(
        `Cannot accept a shift with status: ${shift.status}`,
      );
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: { status: ShiftStatus.CONFIRMED },
      include: shiftIncludes,
    });
  }

  async decline(shiftId: string, userId: string) {
    const shift = await this.getShiftOrThrow(shiftId);
    this.assertIsAssignedCaregiver(shift, userId);

    if (shift.status !== ShiftStatus.PENDING) {
      throw new BadRequestException(
        `Cannot decline a shift with status: ${shift.status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.shift.update({
        where: { id: shiftId },
        data: { status: ShiftStatus.DECLINED },
        include: shiftIncludes,
      });

      // Free the slot so the caregiver can offer it again
      if (shift.availabilitySlotId) {
        await tx.availabilitySlot.update({
          where: { id: shift.availabilitySlotId },
          data: { isBooked: false },
        });
      }

      return updated;
    });
  }

  async cancel(shiftId: string, userId: string, dto: CancelShiftDto) {
    const shift = await this.getShiftOrThrow(shiftId);
    this.assertIsParticipant(shift, userId);

    const nonCancellableStatuses: ShiftStatus[] = [
      ShiftStatus.CANCELLED,
      ShiftStatus.COMPLETED,
      ShiftStatus.DECLINED,
    ];
    if (nonCancellableStatuses.includes(shift.status)) {
      throw new BadRequestException(
        `Cannot cancel a shift with status: ${shift.status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.shift.update({
        where: { id: shiftId },
        data: { status: ShiftStatus.CANCELLED },
        include: shiftIncludes,
      });

      await tx.cancellation.create({
        data: {
          shiftId,
          cancelledById: userId,
          reason: dto.reason,
          notes: dto.notes,
        },
      });

      // Free the slot so another family can request it
      if (shift.availabilitySlotId) {
        await tx.availabilitySlot.update({
          where: { id: shift.availabilitySlotId },
          data: { isBooked: false },
        });
      }

      return updated;
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async getShiftOrThrow(shiftId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        caregiver: true,
        family: true,
      },
    });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  private assertIsAssignedCaregiver(
    shift: Awaited<ReturnType<typeof this.getShiftOrThrow>>,
    userId: string,
  ) {
    if (shift.caregiver.userId !== userId) {
      throw new ForbiddenException('You are not the caregiver for this shift');
    }
  }

  private assertIsParticipant(
    shift: Awaited<ReturnType<typeof this.getShiftOrThrow>>,
    userId: string,
  ) {
    const isCaregiver = shift.caregiver.userId === userId;
    const isFamily = shift.family.userId === userId;
    if (!isCaregiver && !isFamily) {
      throw new ForbiddenException('You are not a participant in this shift');
    }
  }
}

// Shared include shape so all queries return the same structure
const shiftIncludes = {
  caregiver: {
    select: {
      id: true,
      careTypes: true,
      hourlyRate: true,
      rating: true,
      user: { select: { firstName: true, lastName: true, phone: true } },
    },
  },
  family: {
    select: {
      id: true,
      address: true,
      user: { select: { firstName: true, lastName: true, phone: true } },
    },
  },
  cancellation: true,
} as const;
