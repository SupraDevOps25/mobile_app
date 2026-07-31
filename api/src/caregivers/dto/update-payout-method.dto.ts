import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayoutMethod } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

// How the nurse wants to be paid. `method` selects the channel; only that
// channel's fields are required (the service validates and clears the other).
export class UpdatePayoutMethodDto {
  @ApiProperty({ enum: PayoutMethod })
  @IsEnum(PayoutMethod)
  method!: PayoutMethod;

  // ── Mobile money ──
  @ApiPropertyOptional({ example: 'MTN' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  momoNetwork?: string;

  @ApiPropertyOptional({ example: '0244123456' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  momoNumber?: string;

  @ApiPropertyOptional({ example: 'Ama Owusu' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  momoName?: string;

  // ── Bank ──
  @ApiPropertyOptional({ example: 'GCB Bank' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankName?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'Ama Owusu' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankAccountName?: string;
}
