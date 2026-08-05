import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CaregiverDocument,
  DocumentStatus,
  NotificationType,
  VerificationStatus,
} from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SetVerificationDto } from './dto/set-verification.dto';

// Admin-facing caregiver management. The one job that actually unblocks
// onboarding: verifying a nurse's credentials so matching can offer them cases
// (matching filters on `licenseVerified: true`). Kept separate from the
// nurse-facing CaregiversService because the audience and guards differ.
@Injectable()
export class AdminCaregiversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
  ) {}

  /** Review queue. Defaults to everyone; filter by status for the pending tab. */
  async list(status?: VerificationStatus) {
    const profiles = await this.prisma.caregiverProfile.findMany({
      where: status ? { verificationStatus: status } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        _count: { select: { documents: true } },
      },
    });

    return profiles.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: `${p.user.firstName} ${p.user.lastName}`.trim(),
      email: p.user.email,
      phone: p.user.phone,
      photoUrl: p.photoUrl,
      yearsExperience: p.yearsExperience,
      hasHomecareExp: p.hasHomecareExp,
      serviceAreas: p.serviceAreas,
      licenseVerified: p.licenseVerified,
      verificationStatus: p.verificationStatus,
      documentsCount: p._count.documents,
      submittedAt: p.updatedAt,
      createdAt: p.createdAt,
    }));
  }

  /** Full detail incl. uploaded ID/PIN cards, so an admin can eyeball them. */
  async getOne(id: string) {
    const p = await this.prisma.caregiverProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!p) throw new NotFoundException('Caregiver not found');

    return {
      id: p.id,
      userId: p.userId,
      name: `${p.user.firstName} ${p.user.lastName}`.trim(),
      email: p.user.email,
      phone: p.user.phone,
      photoUrl: p.photoUrl,
      bio: p.bio,
      gender: p.gender,
      dateOfBirth: p.dateOfBirth,
      yearsExperience: p.yearsExperience,
      hasHomecareExp: p.hasHomecareExp,
      languages: p.languages,
      serviceAreas: p.serviceAreas,
      licenseVerified: p.licenseVerified,
      verificationStatus: p.verificationStatus,
      createdAt: p.createdAt,
      documents: p.documents.map((d) => this.toDocument(d)),
    };
  }

  /**
   * Approve or reject a nurse. Approving flips `licenseVerified: true` — the
   * single flag matching gates on — so the nurse becomes matchable. We keep the
   * uploaded documents' status in lock-step and notify the nurse either way.
   */
  async setVerification(id: string, dto: SetVerificationDto) {
    const profile = await this.prisma.caregiverProfile.findUnique({
      where: { id },
      select: { id: true, userId: true, verificationStatus: true },
    });
    if (!profile) throw new NotFoundException('Caregiver not found');

    const approved = dto.status === 'VERIFIED';
    const nextStatus = approved
      ? VerificationStatus.VERIFIED
      : VerificationStatus.REJECTED;

    if (profile.verificationStatus === nextStatus) {
      throw new BadRequestException(`Already ${nextStatus}`);
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.caregiverProfile.update({
        where: { id },
        data: {
          verificationStatus: nextStatus,
          licenseVerified: approved,
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          documents: { orderBy: { createdAt: 'desc' } },
        },
      }),
      // Mirror the decision onto the uploaded credentials.
      this.prisma.caregiverDocument.updateMany({
        where: { caregiverId: id },
        data: {
          status: approved ? DocumentStatus.VERIFIED : DocumentStatus.REJECTED,
          reviewNote: dto.note ?? null,
        },
      }),
    ]);

    // Push + in-app inbox (also falls back to WhatsApp when push can't reach).
    await this.notifications.notify({
      userId: profile.userId,
      type: NotificationType.GENERAL,
      title: approved ? 'You’re verified ✅' : 'Verification update',
      body: approved
        ? 'Your credentials were approved. You can now be matched with families.'
        : `Your verification was not approved.${
            dto.note ? ` Reason: ${dto.note}` : ''
          } Please re-check your documents and re-upload.`,
    });

    // Email the decision too. Best-effort — a mail hiccup must not fail the
    // verification write that already succeeded above.
    try {
      await this.mail.sendVerificationDecisionEmail(updated.user.email, {
        firstName: updated.user.firstName,
        approved,
        note: dto.note,
      });
    } catch {
      // Swallowed: the in-app/push notification already went out.
    }

    return {
      id: updated.id,
      name: `${updated.user.firstName} ${updated.user.lastName}`.trim(),
      licenseVerified: updated.licenseVerified,
      verificationStatus: updated.verificationStatus,
      documents: updated.documents.map((d) => this.toDocument(d)),
    };
  }

  private toDocument(d: CaregiverDocument) {
    return {
      id: d.id,
      type: d.type,
      idNumber: d.idNumber,
      url: d.url,
      status: d.status,
      reviewNote: d.reviewNote,
      createdAt: d.createdAt,
    };
  }
}
