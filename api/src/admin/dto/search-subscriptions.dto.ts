import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SearchSubscriptionsDto {
  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({
    description: 'Search by family or care recipient name',
  })
  @IsOptional()
  @IsString()
  q?: string;
}
