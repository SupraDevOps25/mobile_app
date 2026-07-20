import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

// A family telling us no catalog package fits their situation. We forward the
// free-text need to the admin team by email; their account already carries the
// contact details, so this is the only field we collect.
export class CreatePackageRequestDto {
  @ApiProperty({ minLength: 10, maxLength: 1000 })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  message: string;
}
