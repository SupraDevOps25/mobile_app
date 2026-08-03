import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminAnalyticsService } from './admin-analytics.service';

@ApiBearerAuth()
@ApiTags('Admin · Analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly service: AdminAnalyticsService) {}

  @ApiOperation({ summary: 'Admin: analytics (trends + distributions)' })
  @Get()
  overview() {
    return this.service.overview();
  }
}
