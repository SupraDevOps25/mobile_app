import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
    const verifyUrl = `${apiUrl}/api/v1/auth/verify-email?token=${token}`;

    if (!this.transporter) {
      // In development (no SMTP configured) just log the link
      this.logger.log('─────────────────────────────────────────────');
      this.logger.log(`[DEV] Email verification link for ${email}:`);
      this.logger.log(verifyUrl);
      this.logger.log('─────────────────────────────────────────────');
      return;
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'Supracarer <noreply@supracarer.com>',
      to: email,
      subject: 'Verify your Supracarer account',
      html: this.buildVerificationHtml(verifyUrl, email),
    });
  }

  async sendInvoiceEmail(
    email: string,
    params: { recipientName: string; amountGhs: number; periodLabel: string },
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.log('─────────────────────────────────────────────');
      this.logger.log(`[DEV] Invoice for ${email}:`);
      this.logger.log(
        `GHS ${params.amountGhs} — care for ${params.recipientName} (${params.periodLabel}). Log in to the Supracarer app to pay.`,
      );
      this.logger.log('─────────────────────────────────────────────');
      return;
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'Supracarer <noreply@supracarer.com>',
      to: email,
      subject: `Your Supracarer invoice — ${params.periodLabel}`,
      html: this.buildInvoiceHtml(params),
    });
  }

  private buildInvoiceHtml(params: {
    recipientName: string;
    amountGhs: number;
    periodLabel: string;
  }): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Supracarer invoice</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;margin:0">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;padding:40px">
    <h1 style="color:#1e3a8a;margin-bottom:4px">Supracarer</h1>
    <p style="color:#6b7280;margin-top:0">Above and Beyond Care</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <h2 style="color:#0f172a">Invoice for ${params.periodLabel}</h2>
    <p style="color:#374151">Thank you for trusting Supracarer with care for <strong>${params.recipientName}</strong>.</p>
    <p style="color:#0f172a;font-size:28px;font-weight:bold;margin:8px 0">GHS ${params.amountGhs.toLocaleString()}</p>
    <p style="color:#374151">Please log in to the Supracarer app to review and pay this invoice.</p>
    <p style="color:#6b7280;font-size:14px;margin-top:24px">Questions? Reply to this email and your Care Coordinator will help.</p>
  </div>
</body>
</html>`;
  }

  private buildVerificationHtml(verifyUrl: string, email: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Verify your email</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;margin:0">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;padding:40px">
    <h1 style="color:#1e3a8a;margin-bottom:4px">Supracarer</h1>
    <p style="color:#6b7280;margin-top:0">Above and Beyond Care</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <h2 style="color:#0f172a">Verify your email address</h2>
    <p style="color:#374151">Hi! Thanks for signing up with <strong>${email}</strong>. Click the button below to activate your account.</p>
    <a href="${verifyUrl}"
       style="display:inline-block;background:#2563eb;color:white;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:bold;margin:24px 0">
      Verify Email
    </a>
    <p style="color:#6b7280;font-size:14px">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  </div>
</body>
</html>`;
  }
}
