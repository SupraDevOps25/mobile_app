import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { SearchSubscriptionsDto } from './dto/search-subscriptions.dto';

@ApiBearerAuth()
@ApiTags('Admin · Subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly service: AdminSubscriptionsService) {}

  @ApiOperation({
    summary: 'Admin: list all subscriptions (bookings) — filter/search',
  })
  @Get()
  list(@Query() dto: SearchSubscriptionsDto) {
    return this.service.list(dto.status, dto.q);
  }

  @ApiOperation({ summary: 'Admin: full case detail — team, journey, visits' })
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }
}
