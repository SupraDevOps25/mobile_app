import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  CaregiverDocument,
  CaregiverDocumentType,
  CaregiverProfile,
  PaymentStatus,
  PayoutStatus,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { UpdateCaregiverProfileDto } from './dto/update-caregiver-profile.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

// Minimal shape of a multer-uploaded file (avoids depending on @types/multer).
export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC = [...ALLOWED_IMAGE, 'application/pdf'];

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

type EarningsPeriodId = 'month' | 'all';

// One month of earnings from a subscription the nurse serves. Supracarer bills
// families a monthly subscription; the nurse earns their agreed monthly payout
// (Assignment.payoutGhs) for each billing period. Lifecycle of one month:
//   pending   → family hasn't paid yet, or the billing month hasn't ended
//   available → paid + month ended → the nurse can now request this payout
//   requested → nurse requested it; awaiting admin disbursement
//   paid      → admin marked it disbursed
type EarningStatus = 'pending' | 'available' | 'requested' | 'paid';
type Earning = {
  id: string; // the payment (subscription month) id
  subscriptionId: string;
  date: Date; // paidAt ?? billingPeriodStart
  patientName: string;
  service: string;
  amountGhs: number;
  status: EarningStatus;
};

type ProfileWithDocs = CaregiverProfile & { documents?: CaregiverDocument[] };

@Injectable()
export class CaregiversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: CloudinaryService,
  ) {}

  private async requireProfile(userId: string): Promise<CaregiverProfile> {
    const profile = await this.prisma.caregiverProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Caregiver profile not found');
    return profile;
  }

  async getMe(userId: string) {
    const profile = await this.prisma.caregiverProfile.findUnique({
      where: { userId },
      include: { documents: true },
    });
    if (!profile) throw new NotFoundException('Caregiver profile not found');
    return this.toResponse(profile, profile.documents);
  }

  /**
   * The nurse's earnings under Supracarer's subscription model. Families pay a
   * monthly subscription; for each billing period the assigned nurse earns their
   * agreed monthly payout (Assignment.payoutGhs). See EarningStatus for the
   * per-month lifecycle.
   */
  async earnings(userId: string) {
    const profile = await this.requireProfile(userId);
    const earningsList = await this.collectEarnings(profile.id);

    const now = new Date();
    const periods = (['month', 'all'] as EarningsPeriodId[]).map((id) =>
      this.buildEarningsPeriod(id, earningsList, now),
    );

    const sumBy = (status: EarningStatus) =>
      Math.round(
        earningsList
          .filter((e) => e.status === status)
          .reduce((sum, e) => sum + e.amountGhs, 0),
      );

    return {
      rating: Number(profile.rating),
      availableGhs: sumBy('available'), // withdrawable now
      requestedGhs: sumBy('requested'), // awaiting admin disbursement
      paidOutGhs: sumBy('paid'), // disbursed all-time
      periods,
      recentTransactions: earningsList.slice(0, 12).map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        patientName: e.patientName,
        service: e.service,
        amountGhs: e.amountGhs,
        status: e.status,
      })),
    };
  }

  /**
   * Request payout for every completed subscription month that is now available
   * (billing period ended + family paid + not already requested). One payout
   * record is created per month, so an admin can disburse and mark them
   * individually.
   */
  async requestPayout(userId: string) {
    const profile = await this.requireProfile(userId);
    const earningsList = await this.collectEarnings(profile.id);
    const available = earningsList.filter((e) => e.status === 'available');

    if (available.length === 0) {
      throw new BadRequestException(
        'No completed months are available to withdraw yet. Payouts unlock at ' +
          'the end of each subscription month, once the family has paid.',
      );
    }

    await this.prisma.payoutRequest.createMany({
      data: available.map((e) => ({
        caregiverId: profile.id,
        paymentId: e.id,
        amountGhs: e.amountGhs,
      })),
      skipDuplicates: true,
    });

    return {
      count: available.length,
      totalGhs: Math.round(available.reduce((s, e) => s + e.amountGhs, 0)),
    };
  }

  /** Build the nurse's monthly earnings list from their subscriptions' payments. */
  private async collectEarnings(
    caregiverProfileId: string,
  ): Promise<Earning[]> {
    const assignments = await this.prisma.assignment.findMany({
      where: {
        caregiverId: caregiverProfileId,
        status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.ACTIVE] },
        payoutGhs: { not: null },
      },
      include: {
        subscription: {
          include: { careRecipient: { select: { name: true } } },
        },
      },
    });
    if (assignments.length === 0) return [];

    const bySub = new Map(assignments.map((a) => [a.subscriptionId, a]));
    const [payments, packages, payouts] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          subscriptionId: { in: [...bySub.keys()] },
          status: { in: [PaymentStatus.SUCCESS, PaymentStatus.PENDING] },
        },
        orderBy: { billingPeriodStart: 'desc' },
      }),
      this.prisma.package.findMany({ select: { type: true, name: true } }),
      this.prisma.payoutRequest.findMany({
        where: { caregiverId: caregiverProfileId },
        select: { paymentId: true, status: true },
      }),
    ]);
    const nameByType = new Map(packages.map((p) => [p.type, p.name]));
    const payoutByPayment = new Map(
      payouts.map((r) => [r.paymentId, r.status]),
    );
    const now = new Date();

    return payments.map((p) => {
      const a = bySub.get(p.subscriptionId)!;
      const payout = payoutByPayment.get(p.id);
      const monthEnded = p.billingPeriodEnd <= now;

      let status: EarningStatus;
      if (payout === PayoutStatus.PAID) status = 'paid';
      else if (payout === PayoutStatus.PENDING) status = 'requested';
      else if (p.status === PaymentStatus.SUCCESS && monthEnded)
        status = 'available';
      else status = 'pending';

      return {
        id: p.id,
        subscriptionId: p.subscriptionId,
        date: p.paidAt ?? p.billingPeriodStart,
        patientName: a.subscription.careRecipient.name,
        service: nameByType.get(a.subscription.packageType) ?? 'Care plan',
        amountGhs: a.payoutGhs?.toNumber() ?? 0,
        status,
      };
    });
  }

  private buildEarningsPeriod(
    id: EarningsPeriodId,
    earnings: Earning[],
    now: Date,
  ): {
    id: EarningsPeriodId;
    totalGhs: number;
    plans: number;
    subtitle: string;
    chartTitle: string;
    bars: { label: string; amountGhs: number }[];
  } {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const inRange =
      id === 'month'
        ? (d: Date) => d >= monthStart && d < monthEnd
        : () => true;

    const scoped = earnings.filter((e) => inRange(e.date));
    const totalGhs = scoped.reduce((s, e) => s + e.amountGhs, 0);
    const plans = new Set(scoped.map((e) => e.subscriptionId)).size;

    // Monthly trend — the last 6 months (earnings are paid out monthly).
    const bars: { label: string; amountGhs: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const sum = earnings
        .filter((e) => e.date >= d && e.date < mEnd)
        .reduce((s, e) => s + e.amountGhs, 0);
      bars.push({ label: MONTHS[d.getMonth()], amountGhs: sum });
    }

    const planLabel = plans === 1 ? 'care plan' : 'care plans';
    const subtitle =
      id === 'month'
        ? `${MONTHS[now.getMonth()]} ${now.getFullYear()} · ${plans} ${planLabel}`
        : `All time · ${plans} ${planLabel}`;

    return {
      id,
      totalGhs,
      plans,
      subtitle,
      chartTitle:
        id === 'month'
          ? 'Monthly earnings'
          : `Monthly earnings — ${now.getFullYear()}`,
      bars,
    };
  }

  async updateProfile(userId: string, dto: UpdateCaregiverProfileDto) {
    await this.requireProfile(userId);
    const updated = await this.prisma.caregiverProfile.update({
      where: { userId },
      data: {
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.dateOfBirth !== undefined && {
          dateOfBirth: new Date(dto.dateOfBirth),
        }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.lat !== undefined && { lat: dto.lat }),
        ...(dto.lng !== undefined && { lng: dto.lng }),
        ...(dto.serviceAreas !== undefined && {
          serviceAreas: dto.serviceAreas,
        }),
        ...(dto.languages !== undefined && { languages: dto.languages }),
        ...(dto.hasHomecareExp !== undefined && {
          hasHomecareExp: dto.hasHomecareExp,
          // "No experience" implies zero years, unless a value is also sent.
          ...(dto.hasHomecareExp === false &&
            dto.yearsExperience === undefined && { yearsExperience: 0 }),
        }),
        ...(dto.yearsExperience !== undefined && {
          yearsExperience: dto.yearsExperience,
        }),
      },
      include: { documents: true },
    });
    return this.toResponse(updated, updated.documents);
  }

  async setAvailability(userId: string, isAvailable: boolean) {
    await this.requireProfile(userId);
    const updated = await this.prisma.caregiverProfile.update({
      where: { userId },
      data: { isAvailable },
      include: { documents: true },
    });
    return this.toResponse(updated, updated.documents);
  }

  async setSchedule(userId: string, schedule: UpdateScheduleDto) {
    await this.requireProfile(userId);
    const updated = await this.prisma.caregiverProfile.update({
      where: { userId },
      data: {
        // De-duplicate and sort the weekdays so storage is canonical.
        workingDays: [...new Set(schedule.workingDays)].sort((a, b) => a - b),
        workStart: schedule.workStart,
        workEnd: schedule.workEnd,
        maxVisitsPerDay: schedule.maxVisitsPerDay,
      },
      include: { documents: true },
    });
    return this.toResponse(updated, updated.documents);
  }

  // ── Profile photo ──────────────────────────────────────────────────────────

  async uploadPhoto(userId: string, file: UploadedFile) {
    const profile = await this.requireProfile(userId);
    this.assertFile(file, ALLOWED_IMAGE, 'Upload a JPG, PNG or WebP image.');

    const stored = await this.storage.upload(file, {
      folder: `supracarer/caregivers/${profile.id}`,
      publicId: 'photo',
      resourceType: 'image',
    });

    const updated = await this.prisma.caregiverProfile.update({
      where: { userId },
      data: { photoUrl: stored.url, photoPublicId: stored.publicId },
      include: { documents: true },
    });
    return this.toResponse(updated, updated.documents);
  }

  // ── Credentials (documents) ─────────────────────────────────────────────────

  async listDocuments(userId: string) {
    const profile = await this.requireProfile(userId);
    const documents = await this.prisma.caregiverDocument.findMany({
      where: { caregiverId: profile.id },
    });
    return documents.map((d) => this.toDocument(d));
  }

  async uploadDocument(
    userId: string,
    type: CaregiverDocumentType,
    idNumber: string | undefined,
    file: UploadedFile,
  ) {
    const profile = await this.requireProfile(userId);
    this.assertFile(file, ALLOWED_DOC, 'Upload a JPG, PNG or PDF file.');

    const stored = await this.storage.upload(file, {
      folder: `supracarer/caregivers/${profile.id}/documents`,
      publicId: type, // one current file per document type
      resourceType: 'auto',
    });

    // Re-uploading a document resets it to PENDING for a fresh review.
    const document = await this.prisma.caregiverDocument.upsert({
      where: { caregiverId_type: { caregiverId: profile.id, type } },
      create: {
        caregiverId: profile.id,
        type,
        idNumber: idNumber ?? null,
        url: stored.url,
        publicId: stored.publicId,
        fileName: file.originalname,
      },
      update: {
        idNumber: idNumber ?? null,
        url: stored.url,
        publicId: stored.publicId,
        fileName: file.originalname,
        status: 'PENDING',
        reviewNote: null,
        reviewedById: null,
        reviewedAt: null,
      },
    });

    // Once a caregiver has submitted a credential, move them out of UNVERIFIED
    // into review so the app can show the "application submitted" state.
    if (profile.verificationStatus === VerificationStatus.UNVERIFIED) {
      await this.prisma.caregiverProfile.update({
        where: { id: profile.id },
        data: { verificationStatus: VerificationStatus.PENDING_REVIEW },
      });
    }

    return this.toDocument(document);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private assertFile(
    file: UploadedFile | undefined,
    allowed: string[],
    typeMessage: string,
  ) {
    if (!file) throw new BadRequestException('No file was uploaded.');
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('File is too large (max 5 MB).');
    }
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(typeMessage);
    }
  }

  private toDocument(d: CaregiverDocument) {
    return {
      id: d.id,
      type: d.type,
      idNumber: d.idNumber,
      url: d.url,
      fileName: d.fileName,
      status: d.status,
      reviewNote: d.reviewNote,
      reviewedAt: d.reviewedAt,
      createdAt: d.createdAt,
    };
  }

  private toResponse(p: ProfileWithDocs, documents?: CaregiverDocument[]) {
    return {
      id: p.id,
      qualification: p.qualification,
      bio: p.bio,
      gender: p.gender,
      dateOfBirth: p.dateOfBirth,
      address: p.address,
      yearsExperience: p.yearsExperience,
      hasHomecareExp: p.hasHomecareExp,
      languages: p.languages,
      photoUrl: p.photoUrl,
      lat: p.lat,
      lng: p.lng,
      competencies: p.competencies,
      serviceAreas: p.serviceAreas,
      licenseVerified: p.licenseVerified,
      isAvailable: p.isAvailable,
      workingDays: p.workingDays,
      workStart: p.workStart,
      workEnd: p.workEnd,
      maxVisitsPerDay: p.maxVisitsPerDay,
      verificationStatus: p.verificationStatus,
      rating: p.rating.toNumber(),
      reliabilityScore: p.reliabilityScore,
      totalReviews: p.totalReviews,
      documents: (documents ?? []).map((d) => this.toDocument(d)),
    };
  }
}
