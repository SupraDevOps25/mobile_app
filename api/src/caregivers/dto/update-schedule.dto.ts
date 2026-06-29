import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpdateScheduleDto {
  // Weekdays the nurse normally works. JS getDay() encoding: 0=Sun … 6=Sat.
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  workingDays!: number[];

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'workStart must be HH:MM' })
  workStart!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'workEnd must be HH:MM' })
  workEnd!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  maxVisitsPerDay!: number;
}
