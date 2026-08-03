import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentRole,
  AssignmentStatus,
  NotificationType,
  SubscriptionStatus,
  VerificationStatus,
  VisitStatus,
} from '@prisma/client';
import { coordinatorFeeGhs } from '../common/economics';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReassignNurseDto } from './dto/reassign-nurse.dto';
import { UpdateRecipientDto } from './dto/update-recipient.dto';

// Admin read views + overrides over subscriptions (the "cases"/"bookings").
// Full case detail assembles the whole journey; most adjustments reuse the
// coordinator endpoints (now admin-capable), with the admin-only overrides
// (cancel, edit recipient, reassign a specific nurse) handled here.
@Injectable()
export class AdminSubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

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
        payments: { orderBy: { billingPeriodStart: 'desc' } },
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
      // Billing history — one row per month, so an admin can see whether the
      // family has paid for the full duration of the subscription.
      payments: s.payments.map((p) => ({
        id: p.id,
        amount: p.amount.toNumber(),
        status: p.status,
        billingPeriodStart: p.billingPeriodStart.toISOString(),
        billingPeriodEnd: p.billingPeriodEnd.toISOString(),
        paidAt: p.paidAt ? p.paidAt.toISOString() : null,
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

  // ── Admin-only overrides ────────────────────────────────────────────────────

  /** Force-cancel a case regardless of who owns it. */
  async cancel(id: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('This case is already cancelled.');
    }
    await this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELLED },
    });
    return { id, status: SubscriptionStatus.CANCELLED };
  }

  /** Edit the case's care recipient (only the fields provided). */
  async updateRecipient(id: string, dto: UpdateRecipientDto) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      select: { careRecipientId: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const updated = await this.prisma.careRecipient.update({
      where: { id: sub.careRecipientId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.age !== undefined && { age: dto.age }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.relationToAccount !== undefined && {
          relationToAccount: dto.relationToAccount.trim(),
        }),
        ...(dto.area !== undefined && { area: dto.area.trim() }),
        ...(dto.city !== undefined && { city: dto.city.trim() }),
        ...(dto.address !== undefined && { address: dto.address.trim() }),
        ...(dto.conditions !== undefined && {
          conditions: dto.conditions.map((c) => c.trim()).filter(Boolean),
        }),
        ...(dto.basicCareNeeds !== undefined && {
          basicCareNeeds: dto.basicCareNeeds.trim(),
        }),
      },
    });
    return { id: updated.id, name: updated.name };
  }

  /**
   * Manually put a specific (verified) nurse on a case. Swaps the nurse in the
   * given slot (default PRIMARY) and moves this case's still-scheduled visits to
   * them, so the change takes effect going forward. Past visits keep their nurse.
   */
  async reassignNurse(id: string, dto: ReassignNurseDto) {
    const role = dto.role ?? AssignmentRole.PRIMARY;

    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');

    const caregiver = await this.prisma.caregiverProfile.findUnique({
      where: { id: dto.caregiverId },
      include: { user: { select: { id: true } } },
    });
    if (!caregiver) throw new NotFoundException('Nurse not found');
    if (
      !caregiver.licenseVerified ||
      caregiver.verificationStatus !== VerificationStatus.VERIFIED
    ) {
      throw new BadRequestException(
        'That nurse is not verified, so they can’t be assigned.',
      );
    }

    // Reuse the unique (subscription, role) slot: update it in place, or create
    // it if this case never had a nurse in that slot.
    const existing = await this.prisma.assignment.findUnique({
      where: { subscriptionId_role: { subscriptionId: id, role } },
    });
    const assignment = existing
      ? await this.prisma.assignment.update({
          where: { id: existing.id },
          data: {
            caregiverId: caregiver.id,
            status: AssignmentStatus.ACTIVE,
            respondedAt: new Date(),
          },
        })
      : await this.prisma.assignment.create({
          data: {
            subscriptionId: id,
            caregiverId: caregiver.id,
            role,
            status: AssignmentStatus.ACTIVE,
            respondedAt: new Date(),
          },
        });

    // Move upcoming (still-scheduled) visits to the new nurse.
    await this.prisma.visit.updateMany({
      where: { subscriptionId: id, status: VisitStatus.SCHEDULED },
      data: { caregiverId: caregiver.id, assignmentId: assignment.id },
    });

    // Let the nurse know (best-effort).
    await this.notifications
      .notify({
        userId: caregiver.user.id,
        type: NotificationType.ASSIGNMENT_ACCEPTED,
        title: 'You’ve been assigned to a case',
        body: 'An administrator assigned you to a care case. Check your visits for the schedule.',
      })
      .catch(() => undefined);

    return { assignmentId: assignment.id, caregiverId: caregiver.id, role };
  }
}
