import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReassignNurseDto {
  @ApiProperty({ description: 'CaregiverProfile id of the replacement nurse' })
  @IsString()
  caregiverId!: string;

  @ApiPropertyOptional({
    enum: AssignmentRole,
    description: 'Which slot to reassign (defaults to PRIMARY)',
  })
  @IsOptional()
  @IsEnum(AssignmentRole)
  role?: AssignmentRole;
}
