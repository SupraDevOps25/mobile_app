import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PayInvoiceDto {
  @ApiPropertyOptional({
    description:
      "The client's return URL (deep link). Paystack redirects here after " +
      'checkout so the app can resume and verify the payment.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  callbackUrl?: string;
}
