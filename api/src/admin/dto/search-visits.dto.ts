import { ApiPropertyOptional } from '@nestjs/swagger';
import { VisitStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SearchVisitsDto {
  @ApiPropertyOptional({ enum: VisitStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @ApiPropertyOptional({
    description: 'Search by care recipient or nurse name',
  })
  @IsOptional()
  @IsString()
  q?: string;
}
