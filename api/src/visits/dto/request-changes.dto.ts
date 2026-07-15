import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RequestChangesDto {
  @ApiProperty({
    example: 'Please add the patient’s blood pressure reading.',
  })
  @Transform(({ value }) => {
    const v: unknown = value;
    return typeof v === 'string' ? v.trim() : v;
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  note!: string;
}
