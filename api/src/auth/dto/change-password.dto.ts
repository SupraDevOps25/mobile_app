import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentPass123' })
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty({ example: 'newPass1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
