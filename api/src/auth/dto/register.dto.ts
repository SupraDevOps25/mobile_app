import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'jane@family.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+233201234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ enum: ['FAMILY', 'CAREGIVER'], example: 'FAMILY' })
  @IsEnum(['FAMILY', 'CAREGIVER'], {
    message: 'role must be FAMILY or CAREGIVER',
  })
  role!: 'FAMILY' | 'CAREGIVER';
}
