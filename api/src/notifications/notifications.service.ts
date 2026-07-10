import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly twilioAccountSid: string | undefined;
  private readonly twilioAuthToken: string | undefined;
  private readonly twilioFrom: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.twilioAccountSid = config.get<string>('TWILIO_ACCOUNT_SID');
    this.twilioAuthToken = config.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioFrom = config.get<string>('TWILIO_WHATSAPP_FROM');
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Send a notification to a user by id. Resolves their push token, attempts
   * Expo push, falls back to WhatsApp, and records the notification. Feature
   * modules call this for domain events (assignment offers, activation, etc.).
   */
  async notify(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
  }): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        caregiverProfile: { select: { fcmToken: true } },
        familyProfile: { select: { fcmToken: true } },
      },
    });
    if (!user) return;

    const pushToken =
      user.fcmToken ??
      user.caregiverProfile?.fcmToken ??
      user.familyProfile?.fcmToken ??
      null;

    await this.sendToUser({
      userId: params.userId,
      pushToken,
      phone: user.phone,
      type: params.type,
      title: params.title,
      body: params.body,
      prefs: { push: user.notifyPush, sms: user.notifySms },
    });
  }

  /** Admin manual send (same pipeline as notify). */
  async sendManual(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
  }): Promise<void> {
    await this.notify(params);
  }

  // ─── Inbox (the recipient reads their own notifications) ──────────────────

  async listForUser(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      sentAt: n.sentAt,
    }));
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    // Scope the update to the owner so nobody can mark someone else's read.
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  // ─── Core delivery pipeline ───────────────────────────────────────────────

  private async sendToUser(params: {
    userId: string;
    pushToken: string | null;
    phone: string;
    type: NotificationType;
    title: string;
    body: string;
    prefs: { push: boolean; sms: boolean };
  }): Promise<void> {
    let pushSucceeded = false;

    // Only push if the user allows it and we have a device token.
    if (params.prefs.push && params.pushToken) {
      pushSucceeded = await this.sendExpoPush(
        params.pushToken,
        params.title,
        params.body,
      );
    }

    // Fall back to WhatsApp/SMS when push didn't reach them — if allowed.
    if (!pushSucceeded && params.prefs.sms) {
      await this.sendWhatsApp(
        params.phone,
        `*${params.title}*\n${params.body}`,
      );
    }

    // The in-app inbox is always recorded, regardless of channel prefs.
    await this.logNotification(
      params.userId,
      params.type,
      params.title,
      params.body,
    );
  }

  // ─── Device registration (Expo push token) ───────────────────────────────

  async registerDevice(userId: string, token: string) {
    // A device token must map to exactly ONE account. When someone signs in on
    // a device a different account previously used, clear the token from that
    // other account first — otherwise push notifications meant for them would
    // still land on this device (leaking another role's alerts here).
    await this.prisma.$transaction([
      this.prisma.user.updateMany({
        where: { fcmToken: token, id: { not: userId } },
        data: { fcmToken: null },
      }),
      this.prisma.caregiverProfile.updateMany({
        where: { fcmToken: token, userId: { not: userId } },
        data: { fcmToken: null },
      }),
      this.prisma.familyProfile.updateMany({
        where: { fcmToken: token, userId: { not: userId } },
        data: { fcmToken: null },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { fcmToken: token },
      }),
    ]);
    return { registered: true };
  }

  /** Release this device's push token on sign-out so the account stops
   * receiving pushes on a device it no longer owns. */
  async unregisterDevice(userId: string, token: string) {
    await this.prisma.user.updateMany({
      where: { id: userId, fcmToken: token },
      data: { fcmToken: null },
    });
    return { unregistered: true };
  }

  // ─── Channel preferences ──────────────────────────────────────────────────

  async getPreferences(
    userId: string,
  ): Promise<{ push: boolean; sms: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notifyPush: true, notifySms: true },
    });
    return { push: user?.notifyPush ?? true, sms: user?.notifySms ?? true };
  }

  async updatePreferences(
    userId: string,
    prefs: { push?: boolean; sms?: boolean },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(prefs.push !== undefined && { notifyPush: prefs.push }),
        ...(prefs.sms !== undefined && { notifySms: prefs.sms }),
      },
      select: { notifyPush: true, notifySms: true },
    });
    return { push: user.notifyPush, sms: user.notifySms };
  }

  // ─── Expo push ────────────────────────────────────────────────────────────

  private async sendExpoPush(
    token: string,
    title: string,
    body: string,
  ): Promise<boolean> {
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ to: token, title, body, sound: 'default' }),
      });

      const result = (await res.json()) as {
        data: { status: string; message?: string };
      };

      if (result.data.status === 'error') {
        this.logger.warn(
          `Expo push failed: ${result.data.message ?? 'unknown'}`,
        );
        return false;
      }

      return true;
    } catch (err) {
      this.logger.error('Expo push error', err);
      return false;
    }
  }

  // ─── WhatsApp via Twilio ──────────────────────────────────────────────────

  private async sendWhatsApp(to: string, message: string): Promise<void> {
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioFrom) {
      this.logger.warn(`WhatsApp not configured — skipping message to ${to}`);
      return;
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;
      const credentials = Buffer.from(
        `${this.twilioAccountSid}:${this.twilioAuthToken}`,
      ).toString('base64');

      const payload = new URLSearchParams({
        From: this.twilioFrom,
        To: `whatsapp:${to}`,
        Body: message,
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
      });

      if (!res.ok) {
        const err = (await res.json()) as { message: string };
        this.logger.warn(`WhatsApp send failed: ${err.message}`);
      }
    } catch (err) {
      this.logger.error('WhatsApp send error', err);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async logNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
  ) {
    await this.prisma.notification
      .create({ data: { userId, type, title, body } })
      .catch((err: unknown) =>
        this.logger.error('Failed to log notification', err),
      );
  }
}
