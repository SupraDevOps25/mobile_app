import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxx]' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  token!: string;
}
