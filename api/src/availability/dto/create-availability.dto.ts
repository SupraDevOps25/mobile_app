import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';

export class CreateAvailabilityDto {
  @ApiProperty({ example: '2026-06-01T08:00:00.000Z' })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  startTime!: Date;

  @ApiProperty({ example: '2026-06-01T16:00:00.000Z' })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  endTime!: Date;
}
