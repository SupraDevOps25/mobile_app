import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { QueryAvailabilityDto } from './dto/query-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@ApiBearerAuth()
@ApiTags('Availability')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @ApiOperation({ summary: 'Caregiver publishes an available time slot' })
  @Roles('CAREGIVER')
  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(req.user.id, dto);
  }

  @ApiOperation({
    summary: 'Browse available slots (filterable by date and care type)',
  })
  @Get()
  findAll(@Query() query: QueryAvailabilityDto) {
    return this.availabilityService.findAll(query);
  }

  @ApiOperation({
    summary: 'Caregiver updates one of their availability slots',
  })
  @Roles('CAREGIVER')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(id, req.user.id, dto);
  }
}
