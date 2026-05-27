import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class UpdateAvailabilityDto {
  @ApiPropertyOptional({ example: '2026-06-01T09:00:00.000Z' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startTime?: Date;

  @ApiPropertyOptional({ example: '2026-06-01T17:00:00.000Z' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endTime?: Date;
}
