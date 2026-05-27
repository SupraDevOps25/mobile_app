import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { QueryAvailabilityDto } from './dto/query-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAvailabilityDto) {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }

    if (dto.startTime < new Date()) {
      throw new BadRequestException('startTime must be in the future');
    }

    const caregiver = await this.prisma.caregiverProfile.findUnique({
      where: { userId },
    });

    if (!caregiver) {
      throw new NotFoundException('Caregiver profile not found');
    }

    return this.prisma.availabilitySlot.create({
      data: {
        caregiverId: caregiver.id,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });
  }

  async findAll(query: QueryAvailabilityDto) {
    const where: {
      isBooked: boolean;
      caregiverId?: string;
      startTime?: { gte: Date; lte: Date };
      caregiver?: { careTypes?: { has: (typeof query)['careType'] } };
    } = { isBooked: false };

    if (query.caregiverId) {
      where.caregiverId = query.caregiverId;
    }

    if (query.date) {
      const start = new Date(query.date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(query.date);
      end.setUTCHours(23, 59, 59, 999);
      where.startTime = { gte: start, lte: end };
    }

    if (query.careType) {
      where.caregiver = { careTypes: { has: query.careType } };
    }

    return this.prisma.availabilitySlot.findMany({
      where,
      include: {
        caregiver: {
          select: {
            id: true,
            bio: true,
            careTypes: true,
            hourlyRate: true,
            rating: true,
            verificationStatus: true,
            user: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async update(id: string, userId: string, dto: UpdateAvailabilityDto) {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id },
      include: { caregiver: true },
    });

    if (!slot) throw new NotFoundException('Availability slot not found');

    if (slot.caregiver.userId !== userId) {
      throw new ForbiddenException('You do not own this slot');
    }

    if (slot.isBooked) {
      throw new BadRequestException('Cannot modify a booked slot');
    }

    if (dto.startTime && dto.endTime && dto.startTime >= dto.endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }

    return this.prisma.availabilitySlot.update({
      where: { id },
      data: dto,
    });
  }
}
