import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, SubscriptionStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Load a subscription and confirm the caller is a participant — the family
   * account holder or the assigned coordinator. */
  private async context(userId: string, subscriptionId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        family: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        coordinator: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true },
        },
      },
    });
    if (!sub) throw new NotFoundException('Conversation not found');

    const familyUserId = sub.family.userId;
    const isFamily = familyUserId === userId;
    const isCoordinator =
      sub.coordinatorId != null && sub.coordinatorId === userId;
    if (!isFamily && !isCoordinator) {
      throw new ForbiddenException('This conversation is not yours');
    }
    return { sub, isFamily, familyUserId };
  }

  /** Messages for a conversation, with the other participant's details. Marks
   * incoming messages as read. */
  async thread(userId: string, subscriptionId: string) {
    const { sub, isFamily } = await this.context(userId, subscriptionId);

    await this.prisma.message.updateMany({
      where: { subscriptionId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    const messages = await this.prisma.message.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'asc' },
    });

    // The "peer" is whoever the caller is talking to.
    let peer: {
      name: string;
      initials: string;
      role: string;
      photoUrl: string | null;
    } | null = null;
    if (isFamily) {
      if (sub.coordinator) {
        const name = `${sub.coordinator.firstName} ${sub.coordinator.lastName}`;
        peer = {
          name,
          initials: initialsOf(name),
          role: 'Care Coordinator',
          photoUrl: sub.coordinator.photoUrl,
        };
      }
    } else {
      const name = `${sub.family.user.firstName} ${sub.family.user.lastName}`;
      peer = {
        name,
        initials: initialsOf(name),
        role: 'Family',
        photoUrl: sub.family.photoUrl,
      };
    }

    return {
      subscriptionId,
      peer,
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        mine: m.senderId === userId,
        createdAt: m.createdAt,
      })),
    };
  }

  /** The family's active conversation with their coordinator, or null. */
  async familyThread(userId: string) {
    const family = await this.prisma.familyProfile.findUnique({
      where: { userId },
    });
    if (!family) throw new NotFoundException('Family profile not found');

    const sub = await this.prisma.subscription.findFirst({
      where: {
        familyId: family.id,
        status: { not: SubscriptionStatus.CANCELLED },
        coordinatorId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) return null;
    return this.thread(userId, sub.id);
  }

  /** Send a message in a conversation and notify the other participant. */
  async send(userId: string, subscriptionId: string, body: string) {
    const { sub, isFamily, familyUserId } = await this.context(
      userId,
      subscriptionId,
    );
    if (!sub.coordinatorId) {
      throw new BadRequestException(
        'A Care Coordinator has not been assigned to this case yet',
      );
    }

    const message = await this.prisma.message.create({
      data: { subscriptionId, senderId: userId, body: body.trim() },
    });

    const recipientId = isFamily ? sub.coordinatorId : familyUserId;
    const senderName = isFamily
      ? `${sub.family.user.firstName} ${sub.family.user.lastName}`
      : sub.coordinator
        ? `${sub.coordinator.firstName} ${sub.coordinator.lastName}`
        : 'Your Care Coordinator';

    await this.notifications.notify({
      userId: recipientId,
      type: NotificationType.GENERAL,
      title: `New message from ${senderName}`,
      body: body.length > 120 ? `${body.slice(0, 117)}…` : body,
    });

    return {
      id: message.id,
      body: message.body,
      mine: true,
      createdAt: message.createdAt,
    };
  }

  /** Coordinator's conversation list: one per case, newest activity first. */
  async conversations(coordinatorUserId: string) {
    const subs = await this.prisma.subscription.findMany({
      where: {
        coordinatorId: coordinatorUserId,
        status: { not: SubscriptionStatus.CANCELLED },
      },
      include: {
        family: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        careRecipient: { select: { name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const rows = await Promise.all(
      subs.map(async (s) => {
        const unread = await this.prisma.message.count({
          where: {
            subscriptionId: s.id,
            senderId: { not: coordinatorUserId },
            readAt: null,
          },
        });
        const last = s.messages[0] ?? null;
        const name = `${s.family.user.firstName} ${s.family.user.lastName}`;
        return {
          subscriptionId: s.id,
          family: {
            name,
            initials: initialsOf(name),
            photoUrl: s.family.photoUrl,
          },
          recipientName: s.careRecipient.name,
          lastMessage: last?.body ?? null,
          lastAt: last?.createdAt ?? null,
          unread,
        };
      }),
    );

    // Conversations with recent activity first; the rest keep case order.
    return rows.sort((a, b) => {
      if (a.lastAt && b.lastAt)
        return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
      if (a.lastAt) return -1;
      if (b.lastAt) return 1;
      return 0;
    });
  }
}
