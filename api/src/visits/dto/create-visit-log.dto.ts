import { ApiProperty } from '@nestjs/swagger';
import { PatientMood } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

// The nurse's daily care log, submitted when a visit is completed.
export class CreateVisitLogDto {
  @ApiProperty({ example: 'Administered morning medication, monitored BP.' })
  @IsString()
  @IsNotEmpty()
  summary!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiProperty({ required: false, example: '138/88 mmHg' })
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @ApiProperty({ required: false, example: '6.4 mmol/L' })
  @IsOptional()
  @IsString()
  bloodGlucose?: string;

  @ApiProperty({ required: false, example: '72 bpm' })
  @IsOptional()
  @IsString()
  heartRate?: string;

  @ApiProperty({ required: false, example: '36.6 °C' })
  @IsOptional()
  @IsString()
  temperature?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicationsGiven?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  quickLog?: string[];

  @ApiProperty({ enum: PatientMood, required: false })
  @IsOptional()
  @IsEnum(PatientMood)
  mood?: PatientMood;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  followUpRecommended?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  escalationNeeded?: boolean;
}
