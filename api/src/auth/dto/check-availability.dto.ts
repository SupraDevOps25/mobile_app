import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CheckAvailabilityDto {
  @ApiProperty({ example: 'jane@family.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+233244123456' })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}
