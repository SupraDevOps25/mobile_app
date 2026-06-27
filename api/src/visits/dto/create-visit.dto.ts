import { ApiProperty } from '@nestjs/swagger';
import { VisitKind } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateVisitDto {
  @ApiProperty()
  @IsString()
  subscriptionId!: string;

  @ApiProperty({
    enum: VisitKind,
    required: false,
    default: VisitKind.CARE_VISIT,
  })
  @IsOptional()
  @IsEnum(VisitKind)
  kind?: VisitKind;

  @ApiProperty({ example: '2026-07-01T10:00:00.000Z' })
  @IsDateString()
  scheduledFor!: string;

  @ApiProperty({ example: 8 })
  @IsNumber()
  @Min(0.5)
  durationHrs!: number;
}
