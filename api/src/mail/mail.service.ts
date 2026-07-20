import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

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

  async sendVerificationEmail(
    email: string,
    token: string,
    params: { firstName?: string; role?: string } = {},
  ): Promise<void> {
    const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
    const verifyUrl = `${apiUrl}/api/v1/auth/verify-email?token=${token}`;
    const firstName = params.firstName?.trim() || 'there';

    await this.sendMail({
      to: email,
      subject: 'Verify your Supracarer account',
      html: this.buildVerificationHtml({
        email,
        firstName,
        role: params.role,
        verifyUrl,
      }),
      text: [
        `Hi ${firstName},`,
        '',
        'Welcome to Supracarer. Verify your email address to activate your account:',
        verifyUrl,
        '',
        'This link expires in 24 hours. If you did not create an account, you can ignore this email.',
      ].join('\n'),
    });
  }

  async sendInvoiceEmail(
    email: string,
    params: { recipientName: string; amountGhs: number; periodLabel: string },
  ): Promise<void> {
    await this.sendMail({
      to: email,
      subject: `Your Supracarer invoice — ${params.periodLabel}`,
      html: this.buildInvoiceHtml(params),
      text: [
        `Your Supracarer invoice for ${params.periodLabel}`,
        '',
        `Care recipient: ${params.recipientName}`,
        `Amount due: GHS ${params.amountGhs.toLocaleString()}`,
        '',
        'Please log in to the Supracarer app to review and pay this invoice.',
      ].join('\n'),
    });
  }

  /** Forward a family's "no package fits" request to the admin team. */
  async sendPackageRequestEmail(params: {
    familyName: string;
    familyEmail: string;
    phone?: string | null;
    message: string;
  }): Promise<void> {
    const adminEmail =
      process.env.ADMIN_EMAIL ??
      process.env.SUPPORT_EMAIL ??
      'support@supracarer.com';
    const contact = [params.familyEmail, params.phone]
      .filter(Boolean)
      .join(' · ');

    await this.sendMail({
      to: adminEmail,
      subject: `Custom care request — ${params.familyName}`,
      html: this.buildPackageRequestHtml({ ...params, contact }),
      text: [
        'A family says no catalog package fits their situation.',
        '',
        `Family: ${params.familyName}`,
        `Contact: ${contact}`,
        '',
        'What they need:',
        params.message,
      ].join('\n'),
    });
  }

  private buildPackageRequestHtml(params: {
    familyName: string;
    contact: string;
    message: string;
  }): string {
    const familyName = this.escapeHtml(params.familyName);
    const contact = this.escapeHtml(params.contact);
    const message = this.escapeHtml(params.message).replaceAll('\n', '<br>');

    return this.emailShell({
      preview: `Custom care request from ${familyName}`,
      eyebrow: 'Custom care request',
      title: 'A family needs a tailored package',
      body: `
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 18px">
          <strong>${familyName}</strong> couldn't find a catalog package that fits
          their situation and told us what they need.
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:2px 0 18px">
          <p style="color:#0f172a;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px">
            Contact
          </p>
          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0">${contact}</p>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:18px;padding:18px;margin:0">
          <p style="color:#1e3a8a;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px">
            What they need
          </p>
          <p style="color:#1f2937;font-size:15px;line-height:1.6;margin:0">${message}</p>
        </div>
      `,
    });
  }

  private async sendMail(payload: MailPayload): Promise<void> {
    if (process.env.RESEND_API_KEY) {
      await this.sendWithResend(payload);
      return;
    }

    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      return;
    }

    this.logDevEmail(payload);
  }

  private async sendWithResend(payload: MailPayload): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend email failed (${response.status}): ${body}`);
    }
  }

  private get fromAddress(): string {
    return (
      process.env.MAIL_FROM ??
      process.env.RESEND_FROM ??
      process.env.SMTP_FROM ??
      'Supracarer <onboarding@resend.dev>'
    );
  }

  private logDevEmail(payload: MailPayload): void {
    this.logger.log('---------------------------------------------');
    this.logger.log(`[DEV] Email to ${payload.to}: ${payload.subject}`);
    this.logger.log(payload.text);
    this.logger.log('---------------------------------------------');
  }

  private buildInvoiceHtml(params: {
    recipientName: string;
    amountGhs: number;
    periodLabel: string;
  }): string {
    const recipientName = this.escapeHtml(params.recipientName);
    const periodLabel = this.escapeHtml(params.periodLabel);

    return this.emailShell({
      preview: `Your Supracarer invoice for ${periodLabel}`,
      eyebrow: 'Care invoice',
      title: `Invoice for ${periodLabel}`,
      body: `
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 18px">
          Thank you for trusting Supracarer with care for <strong>${recipientName}</strong>.
        </p>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:18px;padding:22px;margin:22px 0">
          <p style="color:#1e3a8a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">
            Amount due
          </p>
          <p style="color:#0f172a;font-size:34px;font-weight:800;margin:0">
            GHS ${params.amountGhs.toLocaleString()}
          </p>
        </div>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0">
          Please log in to the Supracarer app to review and pay this invoice.
        </p>
      `,
    });
  }

  private buildVerificationHtml(params: {
    email: string;
    firstName: string;
    role?: string;
    verifyUrl: string;
  }): string {
    const firstName = this.escapeHtml(params.firstName);
    const email = this.escapeHtml(params.email);
    const verifyUrl = this.escapeHtml(params.verifyUrl);
    const roleLabel = this.roleLabel(params.role);

    return this.emailShell({
      preview: 'Verify your Supracarer account',
      eyebrow: 'Welcome to Supracarer',
      title: `Hi ${firstName}, verify your email`,
      body: `
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 18px">
          Your ${roleLabel} account was created with <strong>${email}</strong>.
          Confirm your email address to activate your account and continue securely.
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#1e3a8a;color:#ffffff;padding:15px 28px;border-radius:999px;text-decoration:none;font-weight:800;font-size:15px;margin:10px 0 24px">
          Verify email address
        </a>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:2px 0 22px">
          <p style="color:#0f172a;font-size:14px;font-weight:800;margin:0 0 10px">
            What happens next?
          </p>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0">
            Once verified, you can sign in, complete your profile, and start using
            Supracarer with protected account access.
          </p>
        </div>
        <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0">
          This link expires in 24 hours. If the button does not work, open the
          Supracarer app and request a new verification email.
        </p>
      `,
    });
  }

  private emailShell(params: {
    preview: string;
    eyebrow: string;
    title: string;
    body: string;
  }): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${params.preview}</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;margin:0;padding:0">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">
    ${params.preview}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:28px 14px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:26px;overflow:hidden;border:1px solid #dbeafe;box-shadow:0 18px 45px rgba(30,58,138,.12)">
          <tr>
            <td style="background:#1e3a8a;padding:30px 28px">
              <p style="color:#bfdbfe;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 10px">
                Above and Beyond Care
              </p>
              <h1 style="color:#ffffff;font-size:30px;line-height:1.15;margin:0;font-weight:900">
                Supracarer
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 28px 16px">
              <p style="color:#2563eb;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:0 0 10px">
                ${params.eyebrow}
              </p>
              <h2 style="color:#0f172a;font-size:26px;line-height:1.25;margin:0 0 16px;font-weight:900">
                ${params.title}
              </h2>
              ${params.body}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 34px">
              <div style="border-top:1px solid #e2e8f0;padding-top:18px">
                <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0">
                  Need help? Please email
                  <a href="mailto:support@supracarer.com" style="color:#2563eb;text-decoration:none;font-weight:700">
                    support@supracarer.com
                  </a>.
                  Do not reply to this automated email.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private roleLabel(role?: string): string {
    if (role === 'CAREGIVER') return 'caregiver';
    if (role === 'FAMILY') return 'family';
    return 'Supracarer';
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
