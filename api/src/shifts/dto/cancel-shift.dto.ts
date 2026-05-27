import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CancellationReason } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CancelShiftDto {
  @ApiProperty({
    enum: CancellationReason,
    example: CancellationReason.SCHEDULE_CHANGE,
  })
  @IsEnum(CancellationReason)
  reason!: CancellationReason;

  @ApiPropertyOptional({ example: 'Family emergency came up' })
  @IsString()
  @IsOptional()
  notes?: string;
}
