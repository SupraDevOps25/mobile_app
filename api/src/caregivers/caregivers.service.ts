import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CaregiverDocument,
  CaregiverDocumentType,
  CaregiverProfile,
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
