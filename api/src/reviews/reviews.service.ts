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
  VisitKind,
  VisitStatus,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export interface PendingCaregiver {
  caregiverId: string;
  role: AssignmentRole;
  name: string;
  initials: string;
  photoUrl: string | null;
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async familyIdFor(userId: string): Promise<string> {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
    });
    if (!family) throw new NotFoundException('Family profile not found');
    return family.id;
  }

  // Lead nurse first, then the assistant, in the review list.
  private static readonly ROLE_WEIGHT: Record<AssignmentRole, number> = {
    PRIMARY: 0,
    ASSISTANT: 1,
    BACKUP_1: 2,
    BACKUP_2: 3,
  };

  /**
   * A subscription's review state: whether all of this cycle's care visits are
   * done (`visitsComplete`) and which nurses (lead + any assistant) still need
   * to be rated (`caregivers`, regardless of whether visits are done yet).
   */
  private async reviewSnapshot(
    subscriptionId: string,
  ): Promise<{ visitsComplete: boolean; caregivers: PendingCaregiver[] }> {
    const nurses = await this.prisma.assignment.findMany({
      where: {
        subscriptionId,
        status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.ACTIVE] },
      },
      include: {
        caregiver: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (nurses.length === 0) return { visitsComplete: false, caregivers: [] };

    const [total, remaining, reviews] = await Promise.all([
      this.prisma.visit.count({
        where: { subscriptionId, kind: VisitKind.CARE_VISIT },
      }),
      this.prisma.visit.count({
        where: {
          subscriptionId,
          kind: VisitKind.CARE_VISIT,
          status: { in: [VisitStatus.SCHEDULED, VisitStatus.IN_PROGRESS] },
        },
      }),
      this.prisma.review.findMany({
        where: { subscriptionId },
        select: { caregiverId: true },
      }),
    ]);

    const visitsComplete = total > 0 && remaining === 0;
    const reviewed = new Set(reviews.map((r) => r.caregiverId));
    const caregivers = nurses
      .filter((n) => !reviewed.has(n.caregiverId))
      .sort(
        (a, b) =>
          ReviewsService.ROLE_WEIGHT[a.role] -
          ReviewsService.ROLE_WEIGHT[b.role],
      )
      .map((n) => {
        const u = n.caregiver.user;
        const name = `${u.firstName} ${u.lastName}`;
        return {
          caregiverId: n.caregiverId,
          role: n.role,
          name,
          initials: initialsOf(name),
          photoUrl: n.caregiver.photoUrl,
        };
      });
    return { visitsComplete, caregivers };
  }

  /**
   * Nurses awaiting the family's review on a subscription — only once all of
   * this cycle's care visits are done. Used by the mandatory end-of-cycle flow.
   */
  private async pendingCaregivers(
    subscriptionId: string,
  ): Promise<PendingCaregiver[]> {
    const snap = await this.reviewSnapshot(subscriptionId);
    return snap.visitsComplete ? snap.caregivers : [];
  }

  /** Used by the renewal flow to make the review mandatory. */
  async isPending(subscriptionId: string): Promise<boolean> {
    return (await this.pendingCaregivers(subscriptionId)).length > 0;
  }

  /**
   * The review state of one of the family's own subscriptions (active or past).
   * Lets the app show a "Rate your nurse" button that's disabled until the care
   * visits are done, and lets families rate a plan they forgot to review even
   * after it becomes previous care.
   */
  async statusForFamily(userId: string, subscriptionId: string) {
    const familyId = await this.familyIdFor(userId);
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub || sub.familyId !== familyId) {
      throw new NotFoundException('Subscription not found');
    }

    const [snap, pkg] = await Promise.all([
      this.reviewSnapshot(subscriptionId),
      this.prisma.package.findUnique({ where: { type: sub.packageType } }),
    ]);
    return {
      subscriptionId,
      packageName: pkg?.name ?? null,
      visitsComplete: snap.visitsComplete,
      caregivers: snap.caregivers,
    };
  }

  /** The nurse(s) the family must rate before continuing. */
  async pendingForFamily(userId: string) {
    const familyId = await this.familyIdFor(userId);
    const sub = await this.prisma.subscription.findFirst({
      where: { familyId, status: { not: SubscriptionStatus.CANCELLED } },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) return null;

    const caregivers = await this.pendingCaregivers(sub.id);
    if (caregivers.length === 0) return null;

    const pkg = await this.prisma.package.findUnique({
      where: { type: sub.packageType },
    });
    return {
      subscriptionId: sub.id,
      packageName: pkg?.name ?? null,
      caregivers,
    };
  }

  /** Family submits a star rating (+ optional comment) for their lead nurse. */
  async submit(userId: string, dto: CreateReviewDto) {
    const familyId = await this.familyIdFor(userId);
    const sub = await this.prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
    });
    if (!sub || sub.familyId !== familyId) {
      throw new NotFoundException('Subscription not found');
    }

    // The caregiver must be a nurse who delivered care on this case.
    const nurse = await this.prisma.assignment.findFirst({
      where: {
        subscriptionId: dto.subscriptionId,
        caregiverId: dto.caregiverId,
        status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.ACTIVE] },
      },
    });
    if (!nurse) {
      throw new BadRequestException('That nurse is not on this case');
    }

    const caregiver = await this.prisma.caregiverProfile.findUnique({
      where: { id: dto.caregiverId },
      select: { userId: true },
    });
    if (!caregiver) throw new NotFoundException('Nurse not found');

    const already = await this.prisma.review.findUnique({
      where: {
        subscriptionId_caregiverId: {
          subscriptionId: dto.subscriptionId,
          caregiverId: dto.caregiverId,
        },
      },
    });
    if (already) {
      throw new BadRequestException('You have already reviewed this nurse');
    }

    const comment = dto.comment?.trim() || null;
    // The Review row is the single source of truth for a nurse's rating; the
    // average + count are derived from it on read (see common/review-stats),
    // so there's no denormalized profile field to keep in sync here.
    const review = await this.prisma.review.create({
      data: {
        subscriptionId: dto.subscriptionId,
        caregiverId: dto.caregiverId,
        familyId,
        rating: dto.rating,
        comment,
      },
    });

    await this.notifications.notify({
      userId: caregiver.userId,
      type: NotificationType.GENERAL,
      title: 'You received a new review',
      body: `A family rated your care ${dto.rating}★${
        comment ? ` — "${comment}"` : ''
      }.`,
    });

    return { id: review.id, rating: review.rating, comment: review.comment };
  }
}
