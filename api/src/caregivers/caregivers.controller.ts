import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CaregiversService } from './caregivers.service';

@ApiBearerAuth()
@ApiTags('Caregivers')
@UseGuards(JwtAuthGuard)
@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @ApiOperation({ summary: 'List all available caregivers' })
  @Get()
  findAll() {
    return this.caregiversService.findAll();
  }

  @ApiOperation({ summary: 'Get full profile for a single caregiver' })
  @Get(':profileId')
  findOne(@Param('profileId') profileId: string) {
    return this.caregiversService.findOne(profileId);
  }
}
