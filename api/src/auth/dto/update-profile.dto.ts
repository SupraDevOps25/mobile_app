import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Self-service profile update available to any authenticated user, regardless
// of role. Only the fields a user may change about themselves — email is
// verified separately and role is fixed.
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiPropertyOptional({ example: '+233201234567' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;
}
