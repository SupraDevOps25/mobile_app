import { ApiProperty } from '@nestjs/swagger';
import { BookingFor, Gender, PackageType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CareRecipientDto {
  @ApiProperty({ enum: BookingFor, example: BookingFor.LOVED_ONE })
  @IsEnum(BookingFor)
  bookingFor!: BookingFor;

  @ApiProperty({ example: 'Kofi Asante' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
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
  @MaxLength(60)
  relationToAccount!: string;

  @ApiProperty({ example: 'East Legon' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  area!: string;

  @ApiProperty({ example: 'Accra' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city!: string;

  @ApiProperty({ example: '14 Boundary Rd, East Legon' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address!: string;

  @ApiProperty({ type: [String], example: ['Hypertension', 'Diabetes Type 2'] })
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  conditions!: string[];

  @ApiProperty({ example: 'Help with morning medication and BP monitoring.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
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
