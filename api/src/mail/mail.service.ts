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

  async sendPasswordResetEmail(
    email: string,
    code: string,
    params: { firstName?: string } = {},
  ): Promise<void> {
    const firstName = params.firstName?.trim() || 'there';

    await this.sendMail({
      to: email,
      subject: 'Reset your Supracarer password',
      html: this.buildPasswordResetHtml({ firstName, code }),
      text: [
        `Hi ${firstName},`,
        '',
        'Use this code to reset your Supracarer password:',
        code,
        '',
        'This code expires in 15 minutes. If you did not request a password reset, you can safely ignore this email — your password will not change.',
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

  /** Tell the admin team a nurse submitted (or re-submitted) a credential for
   * review, so they can verify it and unblock matching. */
  async sendCaregiverDocumentSubmittedEmail(params: {
    nurseName: string;
    nurseEmail: string;
    documentLabel: string;
  }): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL ?? this.supportEmail;

    await this.sendMail({
      to: adminEmail,
      subject: `Credential submitted — ${params.nurseName}`,
      html: this.buildDocumentSubmittedHtml(params),
      text: [
        'A nurse submitted a credential for verification.',
        '',
        `Nurse: ${params.nurseName}`,
        `Email: ${params.nurseEmail}`,
        `Document: ${params.documentLabel}`,
        '',
        'Open the Supracarer admin portal to review and verify it.',
      ].join('\n'),
    });
  }

  /** Tell a nurse the outcome of their credential review. */
  async sendVerificationDecisionEmail(
    email: string,
    params: { firstName?: string; approved: boolean; note?: string | null },
  ): Promise<void> {
    const firstName = params.firstName?.trim() || 'there';
    const subject = params.approved
      ? 'You’re verified on Supracarer ✅'
      : 'Your Supracarer verification update';

    await this.sendMail({
      to: email,
      subject,
      html: this.buildVerificationDecisionHtml({ firstName, ...params }),
      text: params.approved
        ? [
            `Hi ${firstName},`,
            '',
            'Good news — your credentials have been approved. You can now be matched with families and start receiving care requests in the Supracarer app.',
          ].join('\n')
        : [
            `Hi ${firstName},`,
            '',
            'We reviewed your credentials and could not approve them yet.',
            params.note ? `Reason: ${params.note}` : '',
            '',
            'Please re-check your documents and re-upload them in the Supracarer app.',
          ]
            .filter(Boolean)
            .join('\n'),
    });
  }

  /** Forward a family's "no package fits" request to the admin team. */
  async sendPackageRequestEmail(params: {
    familyName: string;
    familyEmail: string;
    phone?: string | null;
    message: string;
  }): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL ?? this.supportEmail;
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

  /** Public-facing support inbox shown in emails; overridable via env. */
  private get supportEmail(): string {
    return process.env.SUPPORT_EMAIL ?? 'support@supracarer.app';
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

  private buildDocumentSubmittedHtml(params: {
    nurseName: string;
    nurseEmail: string;
    documentLabel: string;
  }): string {
    const nurseName = this.escapeHtml(params.nurseName);
    const nurseEmail = this.escapeHtml(params.nurseEmail);
    const documentLabel = this.escapeHtml(params.documentLabel);

    return this.emailShell({
      preview: `${nurseName} submitted a credential for verification`,
      eyebrow: 'Verification queue',
      title: 'A nurse submitted a credential',
      body: `
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 18px">
          <strong>${nurseName}</strong> uploaded a document for review. Verify it
          in the admin portal to unblock matching for this nurse.
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:2px 0 18px">
          <p style="color:#0f172a;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px">
            Nurse
          </p>
          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0">${nurseName} · ${nurseEmail}</p>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:18px;padding:18px;margin:0">
          <p style="color:#1e3a8a;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px">
            Document
          </p>
          <p style="color:#1f2937;font-size:15px;line-height:1.6;margin:0">${documentLabel}</p>
        </div>
      `,
    });
  }

  private buildVerificationDecisionHtml(params: {
    firstName: string;
    approved: boolean;
    note?: string | null;
  }): string {
    const firstName = this.escapeHtml(params.firstName);
    const note = params.note ? this.escapeHtml(params.note) : null;

    const body = params.approved
      ? `
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 18px">
          Good news — your credentials have been <strong>approved</strong>. You
          can now be matched with families and start receiving care requests in
          the Supracarer app.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:18px;padding:18px;margin:0">
          <p style="color:#166534;font-size:15px;line-height:1.6;margin:0">
            Make sure your availability and payout method are set up so you're
            ready to accept your first case.
          </p>
        </div>`
      : `
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 18px">
          We reviewed your credentials and could not approve them yet.
        </p>
        ${
          note
            ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:18px;padding:18px;margin:0 0 18px">
                 <p style="color:#991b1b;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px">Reason</p>
                 <p style="color:#7f1d1d;font-size:15px;line-height:1.6;margin:0">${note}</p>
               </div>`
            : ''
        }
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0">
          Please re-check your documents and re-upload them in the Supracarer app.
        </p>`;

    return this.emailShell({
      preview: params.approved
        ? 'Your Supracarer credentials were approved'
        : 'Your Supracarer verification update',
      eyebrow: 'Verification',
      title: params.approved
        ? `Hi ${firstName}, you're verified`
        : `Hi ${firstName}, an update on your verification`,
      body,
    });
  }

  private buildPasswordResetHtml(params: {
    firstName: string;
    code: string;
  }): string {
    const firstName = this.escapeHtml(params.firstName);
    const code = this.escapeHtml(params.code);

    return this.emailShell({
      preview: 'Your Supracarer password reset code',
      eyebrow: 'Password reset',
      title: `Hi ${firstName}, reset your password`,
      body: `
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 18px">
          We received a request to reset your Supracarer password. Enter the code
          below in the app to set a new one.
        </p>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:18px;padding:22px;margin:2px 0 22px;text-align:center">
          <p style="color:#1e3a8a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">
            Your reset code
          </p>
          <p style="color:#0f172a;font-size:38px;font-weight:800;letter-spacing:.22em;margin:0">
            ${code}
          </p>
        </div>
        <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0">
          This code expires in 15 minutes. If you did not request a password
          reset, you can safely ignore this email — your password will not change.
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
                  <a href="mailto:${this.supportEmail}" style="color:#2563eb;text-decoration:none;font-weight:700">
                    ${this.supportEmail}
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
