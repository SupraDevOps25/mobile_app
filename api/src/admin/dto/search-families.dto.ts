import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchFamiliesDto {
  @ApiPropertyOptional({ description: 'Name, email or phone to search for' })
  @IsOptional()
  @IsString()
  q?: string;
}
