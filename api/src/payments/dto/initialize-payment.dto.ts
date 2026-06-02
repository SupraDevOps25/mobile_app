import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InitializePaymentDto {
  @ApiProperty({ example: 'shift-uuid' })
  @IsString()
  @IsNotEmpty()
  shiftId!: string;
}
