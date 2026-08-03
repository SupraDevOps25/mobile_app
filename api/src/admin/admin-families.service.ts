import { Injectable, NotFoundException } from '@nestjs/common';
import { Role, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Admin read views over families and their subscriptions (cases).
@Injectable()
export class AdminFamiliesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Families with contact details and a summary of their cases. */
  async list(q?: string) {
    const term = (q ?? '').trim();
    const terms = term ? term.split(/\s+/).filter(Boolean) : [];

    const families = await this.prisma.familyProfile.findMany({
      where: terms.length
        ? {
            AND: terms.map((t) => ({
              user: {
                OR: [
                  { firstName: { contains: t, mode: 'insensitive' as const } },
                  { lastName: { contains: t, mode: 'insensitive' as const } },
                  { email: { contains: t, mode: 'insensitive' as const } },
                  { phone: { contains: t } },
                ],
              },
            })),
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        subscriptions: { select: { status: true } },
      },
    });

    return families.map((f) => {
      const active = f.subscriptions.filter(
        (s) => s.status !== SubscriptionStatus.CANCELLED,
      ).length;
      return {
        id: f.id,
        name: `${f.user.firstName} ${f.user.lastName}`.trim(),
        email: f.user.email,
        phone: f.user.phone,
        memberSince: f.createdAt.toISOString(),
        subscriptionsCount: f.subscriptions.length,
        activeCount: active,
      };
    });
  }

  /** A family's profile plus every subscription (case) they've had. */
  async getOne(id: string) {
    const family = await this.prisma.familyProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            emailVerified: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: {
            careRecipient: { select: { name: true } },
            assignments: {
              orderBy: { createdAt: 'asc' },
              include: {
                caregiver: {
                  select: {
                    photoUrl: true,
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!family) throw new NotFoundException('Family not found');

    // Resolve coordinator names in one query (coordinatorId is a User id).
    const coordinatorIds = [
      ...new Set(
        family.subscriptions
          .map((s) => s.coordinatorId)
          .filter((v): v is string => Boolean(v)),
      ),
    ];
    const coordinators = coordinatorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: coordinatorIds }, role: Role.CARE_COORDINATOR },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const nameById = new Map(
      coordinators.map((c) => [c.id, `${c.firstName} ${c.lastName}`.trim()]),
    );

    return {
      id: family.id,
      name: `${family.user.firstName} ${family.user.lastName}`.trim(),
      email: family.user.email,
      phone: family.user.phone,
      emailVerified: family.user.emailVerified,
      address: family.address,
      memberSince: family.createdAt.toISOString(),
      subscriptions: family.subscriptions.map((s) => ({
        id: s.id,
        packageType: s.packageType,
        status: s.status,
        priceGhs: s.priceGhs.toNumber(),
        recipientName: s.careRecipient.name,
        coordinatorName: s.coordinatorId
          ? (nameById.get(s.coordinatorId) ?? 'Unknown')
          : null,
        startedAt: s.startedAt.toISOString(),
        careStartAt: s.careStartAt ? s.careStartAt.toISOString() : null,
        renewsAt: s.renewsAt ? s.renewsAt.toISOString() : null,
        // Every nurse the system offered/assigned for this case, so the admin
        // can see who handled it (and who declined / was replaced).
        nurses: s.assignments.map((a) => ({
          name: `${a.caregiver.user.firstName} ${a.caregiver.user.lastName}`.trim(),
          phone: a.caregiver.user.phone,
          photoUrl: a.caregiver.photoUrl,
          role: a.role,
          status: a.status,
        })),
      })),
    };
  }
}
