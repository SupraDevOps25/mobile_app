import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { coordinatorFeeGhs } from '../common/economics';
import { PrismaService } from '../prisma/prisma.service';

// Admin read views over subscriptions (the "cases"/"bookings"). Full case detail
// assembles the whole journey: team matching, assessment, activation, and every
// visit with its nurse log. Mutations reuse the coordinator endpoints (now
// admin-capable), so this service stays read-only.
@Injectable()
export class AdminSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: SubscriptionStatus, q?: string) {
    const term = (q ?? '').trim();
    const terms = term ? term.split(/\s+/).filter(Boolean) : [];

    const subs = await this.prisma.subscription.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(terms.length
          ? {
              AND: terms.map((t) => ({
                OR: [
                  {
                    careRecipient: {
                      name: { contains: t, mode: 'insensitive' as const },
                    },
                  },
                  {
                    family: {
                      user: {
                        firstName: {
                          contains: t,
                          mode: 'insensitive' as const,
                        },
                      },
                    },
                  },
                  {
                    family: {
                      user: {
                        lastName: { contains: t, mode: 'insensitive' as const },
                      },
                    },
                  },
                ],
              })),
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        careRecipient: { select: { name: true } },
        family: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        coordinator: { select: { firstName: true, lastName: true } },
        _count: { select: { visits: true } },
      },
    });

    return subs.map((s) => ({
      id: s.id,
      packageType: s.packageType,
      status: s.status,
      priceGhs: s.priceGhs.toNumber(),
      familyName: `${s.family.user.firstName} ${s.family.user.lastName}`.trim(),
      recipientName: s.careRecipient.name,
      coordinatorName: s.coordinator
        ? `${s.coordinator.firstName} ${s.coordinator.lastName}`.trim()
        : null,
      visitsCount: s._count.visits,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async getOne(id: string) {
    const s = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        careRecipient: true,
        family: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        coordinator: {
          select: { firstName: true, lastName: true, phone: true },
        },
        assignments: {
          orderBy: { createdAt: 'asc' },
          include: {
            caregiver: {
              select: {
                photoUrl: true,
                user: {
                  select: { firstName: true, lastName: true, phone: true },
                },
              },
            },
          },
        },
        visits: {
          orderBy: { scheduledFor: 'desc' },
          include: {
            caregiver: {
              select: {
                photoUrl: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
            log: true,
          },
        },
      },
    });
    if (!s) throw new NotFoundException('Subscription not found');

    const pkg = await this.prisma.package.findUnique({
      where: { type: s.packageType },
    });

    return {
      id: s.id,
      status: s.status,
      packageType: s.packageType,
      priceGhs: s.priceGhs.toNumber(),
      coordinatorFeeGhs: coordinatorFeeGhs(s.priceGhs.toNumber()),
      needsAssistant: s.needsAssistant,
      assessmentAt: s.assessmentAt ? s.assessmentAt.toISOString() : null,
      careStartAt: s.careStartAt ? s.careStartAt.toISOString() : null,
      activatedAt: s.activatedAt ? s.activatedAt.toISOString() : null,
      startedAt: s.startedAt.toISOString(),
      renewsAt: s.renewsAt ? s.renewsAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
      package: pkg
        ? { name: pkg.name, tagline: pkg.tagline, inclusions: pkg.inclusions }
        : null,
      family: {
        id: s.family.id,
        name: `${s.family.user.firstName} ${s.family.user.lastName}`.trim(),
        email: s.family.user.email,
        phone: s.family.user.phone,
      },
      recipient: {
        name: s.careRecipient.name,
        age: s.careRecipient.age,
        gender: s.careRecipient.gender,
        relationToAccount: s.careRecipient.relationToAccount,
        area: s.careRecipient.area,
        city: s.careRecipient.city,
        address: s.careRecipient.address,
        conditions: s.careRecipient.conditions,
        basicCareNeeds: s.careRecipient.basicCareNeeds,
      },
      coordinator: s.coordinator
        ? {
            name: `${s.coordinator.firstName} ${s.coordinator.lastName}`.trim(),
            phone: s.coordinator.phone,
          }
        : null,
      team: s.assignments.map((a) => ({
        name: `${a.caregiver.user.firstName} ${a.caregiver.user.lastName}`.trim(),
        phone: a.caregiver.user.phone,
        photoUrl: a.caregiver.photoUrl,
        role: a.role,
        status: a.status,
        offeredAt: a.createdAt.toISOString(),
      })),
      visits: s.visits.map((v) => ({
        id: v.id,
        kind: v.kind,
        status: v.status,
        scheduledFor: v.scheduledFor.toISOString(),
        durationHrs: v.durationHrs,
        nurseName:
          `${v.caregiver.user.firstName} ${v.caregiver.user.lastName}`.trim(),
        nursePhotoUrl: v.caregiver.photoUrl,
        log: v.log
          ? {
              summary: v.log.summary,
              observations: v.log.observations,
              bloodPressure: v.log.bloodPressure,
              bloodGlucose: v.log.bloodGlucose,
              heartRate: v.log.heartRate,
              temperature: v.log.temperature,
              medicationsGiven: v.log.medicationsGiven,
              quickLog: v.log.quickLog,
              mood: v.log.mood,
              followUpRecommended: v.log.followUpRecommended,
              escalationNeeded: v.log.escalationNeeded,
              changesRequested: v.log.changesRequested,
              reviewNotes: v.log.reviewNotes,
              submittedAt: v.log.submittedAt.toISOString(),
              reviewedAt: v.log.reviewedAt
                ? v.log.reviewedAt.toISOString()
                : null,
            }
          : null,
      })),
    };
  }
}
