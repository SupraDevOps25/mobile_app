import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Receive push notifications' })
  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @ApiPropertyOptional({ description: 'Receive SMS / WhatsApp messages' })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;
}
