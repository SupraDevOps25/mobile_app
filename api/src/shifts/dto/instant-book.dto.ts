import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CareType } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InstantBookDto {
  @ApiProperty({ example: 'caregiver-profile-uuid' })
  @IsString()
  @IsNotEmpty()
  caregiverProfileId!: string;

  @ApiProperty({ example: '2026-06-26T10:00:00.000Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2026-06-26T12:00:00.000Z' })
  @IsDateString()
  endTime!: string;

  @ApiProperty({ enum: CareType, example: CareType.ELDERLY_CARE })
  @IsEnum(CareType)
  careType!: CareType;

  @ApiPropertyOptional({ example: 'Patient has hypertension, please bring BP monitor.' })
  @IsString()
  @IsOptional()
  notes?: string;
}
