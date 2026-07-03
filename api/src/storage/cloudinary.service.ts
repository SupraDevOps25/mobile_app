import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

export interface StoredFile {
  url: string;
  publicId: string;
}

export interface UploadOptions {
  folder: string;
  /** Stable id so re-uploads overwrite the previous file (e.g. a user's photo). */
  publicId?: string;
  /** 'image' for photos, 'auto' for documents that may be PDFs. */
  resourceType?: 'image' | 'auto';
}

/**
 * Thin wrapper over the Cloudinary SDK. The API secret stays server-side: the
 * mobile client uploads a multipart file to our API, and we stream it to
 * Cloudinary here, persisting only the secure URL + public id.
 *
 * Requires CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.
 * If unset the service boots but uploads throw a clear 400 rather than crashing.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly configured: boolean;

  constructor(config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');
    this.configured = Boolean(cloudName && apiKey && apiSecret);
    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } else {
      this.logger.warn(
        'Cloudinary is not configured — uploads will fail until CLOUDINARY_* env vars are set.',
      );
    }
  }

  async upload(
    file: { buffer: Buffer; mimetype: string },
    { folder, publicId, resourceType = 'image' }: UploadOptions,
  ): Promise<StoredFile> {
    if (!this.configured) {
      throw new BadRequestException(
        'File storage is not configured on the server yet.',
      );
    }
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: resourceType,
          overwrite: true,
          invalidate: true,
        },
        (err, res) => {
          if (err || !res) {
            return reject(
              err instanceof Error ? err : new Error('Upload failed'),
            );
          }
          resolve(res);
        },
      );
      stream.end(file.buffer);
    });
    return { url: result.secure_url, publicId: result.public_id };
  }

  /** Best-effort delete; a storage failure must not block the caller. */
  async remove(publicId: string): Promise<void> {
    if (!this.configured || !publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    } catch (err) {
      this.logger.warn(
        `Failed to remove ${publicId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
