import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminStatsService } from './admin-stats.service';

@ApiBearerAuth()
@ApiTags('Admin · Stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly service: AdminStatsService) {}

  @ApiOperation({ summary: 'Admin: dashboard overview metrics' })
  @Get()
  overview() {
    return this.service.overview();
  }
}
