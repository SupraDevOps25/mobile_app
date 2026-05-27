import { ApiPropertyOptional } from '@nestjs/swagger';
import { CareType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryAvailabilityDto {
  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiPropertyOptional({ enum: CareType })
  @IsEnum(CareType)
  @IsOptional()
  careType?: CareType;

  @ApiPropertyOptional({ example: 'caregiver-uuid' })
  @IsString()
  @IsOptional()
  caregiverId?: string;
}
