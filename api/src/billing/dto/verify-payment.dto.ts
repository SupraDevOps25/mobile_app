import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Paystack transaction reference' })
  @IsString()
  @IsNotEmpty()
  reference!: string;
}
