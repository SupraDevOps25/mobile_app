import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class BanUserDto {
  @ApiProperty({ description: 'true to ban, false to un-ban' })
  @IsBoolean()
  banned!: boolean;

  @ApiPropertyOptional({
    description: 'Reason shown to the account (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
