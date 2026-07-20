import { ApiProperty } from '@nestjs/swagger';
import { VisitStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

// Admin manual override of a visit's status (e.g. correct an auto-flagged miss).
export class UpdateVisitStatusDto {
  @ApiProperty({ enum: VisitStatus })
  @IsEnum(VisitStatus)
  status: VisitStatus;
}
