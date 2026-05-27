import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CareType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateShiftDto {
  @ApiProperty({ example: 'availability-slot-uuid' })
  @IsString()
  @IsNotEmpty()
  availabilitySlotId!: string;

  @ApiProperty({ enum: CareType, example: CareType.ELDERLY_CARE })
  @IsEnum(CareType)
  careType!: CareType;

  @ApiPropertyOptional({
    example: 'Patient has mobility issues, needs assistance walking',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
