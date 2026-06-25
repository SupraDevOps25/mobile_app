import { ApiProperty } from '@nestjs/swagger';
import { Gender, PackageType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CareRecipientDto {
  @ApiProperty({ example: 'Kofi Asante' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 87 })
  @IsInt()
  @Min(0)
  @Max(130)
  age!: number;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty({ example: 'Father' })
  @IsString()
  @IsNotEmpty()
  relationToAccount!: string;

  @ApiProperty({ example: 'East Legon' })
  @IsString()
  @IsNotEmpty()
  area!: string;

  @ApiProperty({ example: 'Accra' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: '14 Boundary Rd, East Legon' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ type: [String], example: ['Hypertension', 'Diabetes Type 2'] })
  @IsArray()
  @IsString({ each: true })
  conditions!: string[];

  @ApiProperty({ example: 'Help with morning medication and BP monitoring.' })
  @IsString()
  @IsNotEmpty()
  basicCareNeeds!: string;
}

export class SubscribeDto {
  @ApiProperty({ enum: PackageType, example: PackageType.DAILY_ASSIST })
  @IsEnum(PackageType)
  packageType!: PackageType;

  @ApiProperty({ type: CareRecipientDto })
  @ValidateNested()
  @Type(() => CareRecipientDto)
  careRecipient!: CareRecipientDto;
}
