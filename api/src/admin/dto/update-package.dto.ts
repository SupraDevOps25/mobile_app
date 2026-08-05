import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// The catalog's package `type` is fixed (enum); only these presentation +
// pricing fields are editable.
export class UpdatePackageDto {
  @ApiPropertyOptional({ example: 'Wellness' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'Light, proactive support' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  tagline?: string;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceGhs?: number;

  @ApiPropertyOptional({ example: ['Weekly nurse visit'] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  inclusions?: string[];
}
