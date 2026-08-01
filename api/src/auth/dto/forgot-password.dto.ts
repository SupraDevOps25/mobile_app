import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'jane@example.com', description: 'Email or +233 phone' })
  @IsString()
  @MinLength(1)
  emailOrPhone!: string;
}
