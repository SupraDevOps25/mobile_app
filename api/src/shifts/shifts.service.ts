import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ShiftStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CancelShiftDto } from './dto/cancel-shift.dto';
import { CreateShiftDto } from './dto/create-shift.dto';

const RESPONSE_DEADLINE_HOURS = 2;

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Instant booking — creates a CONFIRMED shift directly, bypassing the
   * availability-slot / caregiver-accept flow. Used for immediate payment.
   * availabilitySlotId is left null since no slot is consumed.
   */
  async instantBook(userId: string, dto: import('./dto/instant-book.dto').InstantBookDto) {
    const family = await this.prisma.familyProfile.findUnique({ where: { userId } });
    if (!family) throw new NotFoundException('Family profile not found');

    const caregiver = await this.prisma.caregiverProfile.findUnique({
      where: { id: dto.caregiverProfileId },
    });
    if (!caregiver) throw new NotFoundException('Caregiver not found');

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    const shift = await this.prisma.shift.create({
      data: {
        familyId: family.id,
        caregiverId: caregiver.id,
        careType: dto.careType,
        startTime: start,
        endTime: end,
        status: ShiftStatus.CONFIRMED,
        responseDeadline: start, // already confirmed — deadline is moot
        notes: dto.notes,
      },
      include: shiftIncludes,
    });

    return shift;
  }

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
    const shift = await this.prisma.$transaction(async (tx) => {
      const created = await tx.shift.create({
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

      return created;
    });

    void this.notifications
      .notifyShiftRequested(shift.id)
      .catch((err: unknown) =>
        this.logger.error('notifyShiftRequested failed', err),
      );

    return shift;
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

    const updated = await this.prisma.shift.update({
      where: { id: shiftId },
      data: { status: ShiftStatus.CONFIRMED },
      include: shiftIncludes,
    });

    void this.notifications
      .notifyShiftAccepted(shiftId)
      .catch((err: unknown) =>
        this.logger.error('notifyShiftAccepted failed', err),
      );

    return updated;
  }

  async decline(shiftId: string, userId: string) {
    const shift = await this.getShiftOrThrow(shiftId);
    this.assertIsAssignedCaregiver(shift, userId);

    if (shift.status !== ShiftStatus.PENDING) {
      throw new BadRequestException(
        `Cannot decline a shift with status: ${shift.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.shift.update({
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

      return result;
    });

    void this.notifications
      .notifyShiftDeclined(shiftId)
      .catch((err: unknown) =>
        this.logger.error('notifyShiftDeclined failed', err),
      );

    return updated;
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.shift.update({
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

      return result;
    });

    void this.notifications
      .notifyShiftCancelled(shiftId, userId)
      .catch((err: unknown) =>
        this.logger.error('notifyShiftCancelled failed', err),
      );

    return updated;
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
