import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCaregiverProfileDto {
  @ApiPropertyOptional({
    example: 'Registered nurse with 5 years of experience.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  bio?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '1994-05-12' })
  @IsOptional()
  @IsISO8601()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '12 Boundary Rd, East Legon' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ example: ['East Legon, Accra'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceAreas?: string[];

  @ApiPropertyOptional({ example: ['English', 'Twi'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasHomecareExp?: boolean;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsExperience?: number;

  @ApiPropertyOptional({ example: 5.6037 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -0.187 })
  @IsOptional()
  @IsNumber()
  lng?: number;
}
