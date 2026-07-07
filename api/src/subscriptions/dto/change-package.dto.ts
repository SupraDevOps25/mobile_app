import { ApiProperty } from '@nestjs/swagger';
import { PackageType } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ChangePackageDto {
  @ApiProperty({
    enum: PackageType,
    example: PackageType.EXTENDED_ASSIST,
    description:
      'The package the coordinator recommends for the family, replacing the current one (re-prices the case).',
  })
  @IsEnum(PackageType)
  packageType!: PackageType;
}
