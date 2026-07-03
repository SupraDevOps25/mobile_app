import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestChangesDto {
  @ApiPropertyOptional({
    example: 'Please add the patient’s blood pressure reading.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
