import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CaregiversService } from './caregivers.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@ApiBearerAuth()
@ApiTags('Caregivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CAREGIVER')
@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @ApiOperation({ summary: 'Nurse: get my profile' })
  @Get('me')
  getMe(@Request() req: { user: { id: string } }) {
    return this.caregiversService.getMe(req.user.id);
  }

  @ApiOperation({ summary: 'Nurse: set my availability' })
  @Patch('me/availability')
  setAvailability(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.caregiversService.setAvailability(req.user.id, dto.isAvailable);
  }

  @ApiOperation({ summary: 'Nurse: set my weekly working schedule' })
  @Patch('me/schedule')
  setSchedule(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.caregiversService.setSchedule(req.user.id, dto);
  }
}
