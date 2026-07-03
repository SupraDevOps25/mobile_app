import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  /** Check email + phone uniqueness before registration. */
  async checkAvailability(dto: CheckAvailabilityDto) {
    const [emailUser, phoneUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findUnique({ where: { phone: dto.phone } }),
    ]);

    if (emailUser) throw new ConflictException('Email already registered');
    if (phoneUser)
      throw new ConflictException('Phone number already registered');

    return { available: true };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });

    if (existing) {
      throw new ConflictException('Email or phone already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user + role-specific profile in one transaction so
    // we never end up with a user that has no profile.
    const user = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const created = await tx.user.create({
          data: {
            email: dto.email,
            phone: dto.phone,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: dto.role,
          },
        });

        if (dto.role === Role.CAREGIVER) {
          await tx.caregiverProfile.create({
            data: { userId: created.id },
          });
        } else if (dto.role === Role.FAMILY) {
          await tx.familyProfile.create({
            data: { userId: created.id },
          });
        }

        return created;
      },
    );

    // Create verification token and send email
    const verification = await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await this.mail.sendVerificationEmail(user.email, verification.token);

    return { message: `Verification email sent to ${user.email}` };
  }

  async verifyEmail(token: string): Promise<string> {
    const record = await this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) return this.verificationHtml('invalid');
    if (record.expiresAt < new Date()) {
      await this.prisma.emailVerification.delete({ where: { token } });
      return this.verificationHtml('expired');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerification.delete({ where: { token } }),
    ]);

    return this.verificationHtml('success', record.user.email);
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always return success to avoid leaking whether an email is registered
    if (!user || user.emailVerified) {
      return {
        message:
          'If that email is pending verification, a new link has been sent.',
      };
    }

    // Delete old tokens then create a fresh one
    await this.prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    });

    const verification = await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.mail.sendVerificationEmail(user.email, verification.token);

    return { message: 'Verification email resent.' };
  }

  async login(dto: LoginDto) {
    const isEmail = dto.emailOrPhone.includes('@');

    const user = await this.prisma.user.findFirst({
      where: isEmail
        ? { email: dto.emailOrPhone }
        : { phone: dto.emailOrPhone },
    });

    // Same error for wrong identifier and wrong password — prevents user enumeration
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Please verify your email address before signing in',
      );
    }

    return this.signToken(user.id, user.email, user.role, user.firstName);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        caregiverProfile: true,
        familyProfile: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Self-service profile update for any authenticated user (any role). */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'That phone number is already in use by another account',
        );
      }
      throw err;
    }
    return this.getProfile(userId);
  }

  /** Change the logged-in user's password (verifies the current one first). */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const ok = await bcrypt.compare(dto.currentPassword, user.password);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    if (await bcrypt.compare(dto.newPassword, user.password)) {
      throw new ConflictException(
        'New password must be different from the current one',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return { changed: true };
  }

  private signToken(
    userId: string,
    email: string,
    role: string,
    firstName: string,
  ) {
    const payload: JwtPayload = { sub: userId, email, role, firstName };
    return { accessToken: this.jwt.sign(payload) };
  }

  private verificationHtml(
    status: 'success' | 'expired' | 'invalid',
    email?: string,
  ): string {
    const content =
      status === 'success'
        ? {
            icon: '✅',
            title: 'Email Verified!',
            body: `<strong>${email}</strong> is now verified. Open the Supracarer app and sign in.`,
            color: '#16a34a',
          }
        : status === 'expired'
          ? {
              icon: '⏰',
              title: 'Link Expired',
              body: 'This verification link has expired. Open the app and request a new one.',
              color: '#d97706',
            }
          : {
              icon: '❌',
              title: 'Invalid Link',
              body: 'This verification link is not valid or has already been used.',
              color: '#dc2626',
            };

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${content.title} — Supracarer</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;padding:20px;box-sizing:border-box">
  <div style="background:white;border-radius:16px;padding:40px;max-width:420px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <h2 style="color:#1e3a8a;margin:0 0 4px">Supracarer</h2>
    <p style="color:#6b7280;margin:0 0 24px;font-size:14px">Above and Beyond Care</p>
    <div style="font-size:56px;margin-bottom:16px">${content.icon}</div>
    <h1 style="color:${content.color};margin:0 0 12px;font-size:24px">${content.title}</h1>
    <p style="color:#374151;line-height:1.6">${content.body}</p>
    ${
      status === 'success'
        ? `<p style="color:#6b7280;font-size:13px;margin-top:24px">
            You can close this page and return to the Supracarer app.
           </p>`
        : ''
    }
  </div>
</body>
</html>`;
  }
}
