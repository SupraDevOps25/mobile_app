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

  // ─── Shift event triggers ─────────────────────────────────────────────────

  async notifyShiftRequested(shiftId: string): Promise<void> {
    const shift = await this.loadShift(shiftId);
    if (!shift) return;

    const { startTime } = shift;
    const familyName = `${shift.family.user.firstName} ${shift.family.user.lastName}`;
    const title = 'New Shift Request';
    const body = `${familyName} has requested your care services on ${this.formatDate(startTime)}.`;

    await this.sendToUser({
      userId: shift.caregiver.userId,
      pushToken: shift.caregiver.fcmToken,
      phone: shift.caregiver.user.phone,
      type: NotificationType.SHIFT_REQUEST,
      title,
      body,
    });
  }

  async notifyShiftAccepted(shiftId: string): Promise<void> {
    const shift = await this.loadShift(shiftId);
    if (!shift) return;

    const caregiverName = `${shift.caregiver.user.firstName} ${shift.caregiver.user.lastName}`;
    const title = 'Shift Confirmed!';
    const body = `${caregiverName} has accepted your shift request for ${this.formatDate(shift.startTime)}.`;

    await this.sendToUser({
      userId: shift.family.userId,
      pushToken: shift.family.fcmToken,
      phone: shift.family.user.phone,
      type: NotificationType.SHIFT_CONFIRMED,
      title,
      body,
    });
  }

  async notifyShiftDeclined(shiftId: string): Promise<void> {
    const shift = await this.loadShift(shiftId);
    if (!shift) return;

    const title = 'Shift Request Declined';
    const body = `Your shift request for ${this.formatDate(shift.startTime)} was declined. Check backup caregivers.`;

    await this.sendToUser({
      userId: shift.family.userId,
      pushToken: shift.family.fcmToken,
      phone: shift.family.user.phone,
      type: NotificationType.SHIFT_DECLINED,
      title,
      body,
    });
  }

  async notifyShiftCancelled(
    shiftId: string,
    cancelledByUserId: string,
  ): Promise<void> {
    const shift = await this.loadShift(shiftId);
    if (!shift) return;

    const cancelledByCaregiver = shift.caregiver.userId === cancelledByUserId;

    if (cancelledByCaregiver) {
      // Notify the family
      const body = `Your shift for ${this.formatDate(shift.startTime)} was cancelled by the caregiver. Check backup caregivers.`;
      await this.sendToUser({
        userId: shift.family.userId,
        pushToken: shift.family.fcmToken,
        phone: shift.family.user.phone,
        type: NotificationType.SHIFT_CANCELLED,
        title: 'Shift Cancelled',
        body,
      });
    } else {
      // Notify the caregiver
      const body = `The shift for ${this.formatDate(shift.startTime)} was cancelled by the family.`;
      await this.sendToUser({
        userId: shift.caregiver.userId,
        pushToken: shift.caregiver.fcmToken,
        phone: shift.caregiver.user.phone,
        type: NotificationType.SHIFT_CANCELLED,
        title: 'Shift Cancelled',
        body,
      });
    }
  }

  // ─── Manual send (admin use) ──────────────────────────────────────────────

  async sendManual(params: {
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
      user.caregiverProfile?.fcmToken ?? user.familyProfile?.fcmToken ?? null;

    await this.sendToUser({
      userId: params.userId,
      pushToken,
      phone: user.phone,
      type: params.type,
      title: params.title,
      body: params.body,
    });
  }

  // ─── Core delivery pipeline ───────────────────────────────────────────────

  private async sendToUser(params: {
    userId: string;
    pushToken: string | null;
    phone: string;
    type: NotificationType;
    title: string;
    body: string;
  }): Promise<void> {
    let pushSucceeded = false;

    if (params.pushToken) {
      pushSucceeded = await this.sendExpoPush(
        params.pushToken,
        params.title,
        params.body,
      );
    }

    if (!pushSucceeded) {
      await this.sendWhatsApp(
        params.phone,
        `*${params.title}*\n${params.body}`,
      );
    }

    await this.logNotification(
      params.userId,
      params.type,
      params.title,
      params.body,
    );
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

  private async loadShift(shiftId: string) {
    return this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        caregiver: { include: { user: true } },
        family: { include: { user: true } },
      },
    });
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('en-GH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
