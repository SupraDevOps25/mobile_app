import { ApiProperty } from '@nestjs/swagger';
import { PackageType } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePackageDto {
  @ApiProperty({ enum: PackageType })
  @IsEnum(PackageType)
  type!: PackageType;

  @ApiProperty({ example: 'Wellness' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'Light, proactive support for independent living' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  tagline!: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  priceGhs!: number;

  @ApiProperty({ example: ['Weekly nurse visit', 'Medication reminders'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  inclusions!: string[];
}
