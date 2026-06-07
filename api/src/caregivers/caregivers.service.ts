import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const AVATAR_COLORS = [
  '#3b82f6', '#1e40af', '#4f46e5', '#d97706',
  '#10b981', '#8b5cf6', '#ec4899', '#14b8a6',
];

function avatarColorFor(profileId: string): string {
  let hash = 0;
  for (let i = 0; i < profileId.length; i++) {
    hash = profileId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initialsFor(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function careTypeLabel(careType: string): string {
  const labels: Record<string, string> = {
    ELDERLY_CARE: 'Elder Care Specialist',
    CHILD_CARE: 'Child Care Specialist',
    DISABILITY_CARE: 'Disability Care Specialist',
    POSTPARTUM_CARE: 'Postpartum Care Specialist',
    PALLIATIVE_CARE: 'Palliative Care Specialist',
  };
  return labels[careType] ?? careType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProfile = any;

@Injectable()
export class CaregiversService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const profiles = await this.prisma.caregiverProfile.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } },
        availabilitySlots: {
          where: {
            isBooked: false,
            startTime: {
              gte: new Date(),
              lte: new Date(Date.now() + 48 * 60 * 60 * 1000),
            },
          },
          orderBy: { startTime: 'asc' },
          take: 1,
        },
      },
      orderBy: { rating: 'desc' },
    });

    return profiles.map((p) => this.toSummary(p));
  }

  async findOne(profileId: string) {
    const p = await this.prisma.caregiverProfile.findUnique({
      where: { id: profileId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        availabilitySlots: {
          where: { isBooked: false, startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
        },
      },
    });
    if (!p) throw new NotFoundException('Caregiver not found');
    return this.toDetail(p);
  }

  private toSummary(p: AnyProfile) {
    const name = `${p.user.firstName} ${p.user.lastName}`;
    const nextSlot = p.availabilitySlots?.[0];
    const isToday = nextSlot
      ? new Date(nextSlot.startTime).toDateString() === new Date().toDateString()
      : false;

    return {
      profileId: p.id as string,
      name,
      initials: initialsFor(p.user.firstName, p.user.lastName),
      avatarColor: avatarColorFor(p.id as string),
      role: p.careTypes[0] ? careTypeLabel(p.careTypes[0] as string) : 'Caregiver',
      careTypes: p.careTypes as string[],
      yearsExp: 0, // add yearsExperience to CaregiverProfile schema to populate this
      rating: parseFloat(p.rating.toString()),
      hourlyRate: p.hourlyRate ? parseFloat(p.hourlyRate.toString()) : 0,
      verificationStatus: p.verificationStatus as string,
      availability: (isToday ? 'today' : 'tomorrow') as 'today' | 'tomorrow',
    };
  }

  private toDetail(p: AnyProfile) {
    const summary = this.toSummary(p);
    return {
      ...summary,
      bio: (p.bio ?? '') as string,
      availabilitySlots: (p.availabilitySlots ?? []).map((s: AnyProfile) => ({
        id: s.id as string,
        startTime: s.startTime as Date,
        endTime: s.endTime as Date,
      })),
    };
  }
}
