import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class SetAssessmentDto {
  @ApiProperty({
    example: '2026-07-01T10:00:00.000Z',
    description:
      'Agreed date/time of the initial home visit (assessment), set by the coordinator with the accepted nurse.',
  })
  @IsDateString()
  assessmentAt!: string;
}
