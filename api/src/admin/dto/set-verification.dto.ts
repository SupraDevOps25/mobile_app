import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// An admin either approves a nurse (VERIFIED → they become matchable) or
// rejects them (REJECTED → not matchable, with a reason the nurse can see).
// UNVERIFIED/PENDING_REVIEW are set by the nurse's own upload flow, never here.
export type VerificationDecision = 'VERIFIED' | 'REJECTED';

export class SetVerificationDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED'] })
  @IsIn(['VERIFIED', 'REJECTED'])
  status!: VerificationDecision;

  @ApiPropertyOptional({
    description: 'Reason shown to the nurse (recommended when rejecting).',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
