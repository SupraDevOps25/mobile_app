import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'jane@example.com',
    description: 'Email or +233 phone',
  })
  @IsString()
  @MinLength(1)
  emailOrPhone!: string;

  @ApiProperty({
    example: '482913',
    description: '6-digit code from the email',
  })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({ example: 'newPass1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
