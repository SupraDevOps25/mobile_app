import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'paystack-reference-string' })
  @IsString()
  @IsNotEmpty()
  reference!: string;
}
