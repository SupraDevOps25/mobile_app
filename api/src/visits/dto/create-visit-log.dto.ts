import { ApiProperty } from '@nestjs/swagger';
import { PatientMood } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// The nurse's daily care log, submitted when a visit is completed.
export class CreateVisitLogDto {
  @ApiProperty({ example: 'Administered morning medication, monitored BP.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  summary!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string;

  @ApiProperty({ required: false, example: '138/88 mmHg' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  bloodPressure?: string;

  @ApiProperty({ required: false, example: '6.4 mmol/L' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  bloodGlucose?: string;

  @ApiProperty({ required: false, example: '72 bpm' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  heartRate?: string;

  @ApiProperty({ required: false, example: '36.6 °C' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  temperature?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  medicationsGiven?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
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
