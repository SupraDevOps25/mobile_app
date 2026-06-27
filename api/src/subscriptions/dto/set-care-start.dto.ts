import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class SetCareStartDto {
  @ApiProperty({
    example: '2026-07-01T08:00:00.000Z',
    description: 'Day and time care begins, captured at the assessment visit.',
  })
  @IsDateString()
  careStartAt!: string;
}
