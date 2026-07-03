import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CaregiverDocumentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

// Sent as multipart form fields alongside the uploaded file.
export class UploadDocumentDto {
  @ApiProperty({ enum: CaregiverDocumentType })
  @IsEnum(CaregiverDocumentType)
  type!: CaregiverDocumentType;

  @ApiPropertyOptional({
    example: 'GHA-123456789-0',
    description: 'The number printed on the card (Ghana Card PIN or NMC PIN).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  idNumber?: string;
}
