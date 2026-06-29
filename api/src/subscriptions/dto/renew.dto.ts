import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class RenewDto {
  // When true, keep the coordinator but re-match the nurses (e.g. the family
  // had concerns and wants a different caregiver for the next period).
  @IsOptional()
  @IsBoolean()
  rematch?: boolean;

  // Optional note shared with the coordinator when re-matching.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
