import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminVisitsService } from './admin-visits.service';
import { SearchVisitsDto } from './dto/search-visits.dto';

@ApiBearerAuth()
@ApiTags('Admin · Visits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/visits')
export class AdminVisitsController {
  constructor(private readonly service: AdminVisitsService) {}

  @ApiOperation({
    summary: 'Admin: recent visits (filter by status / search by name)',
  })
  @Get()
  list(@Query() dto: SearchVisitsDto) {
    return this.service.list(dto.status, dto.q);
  }
}
