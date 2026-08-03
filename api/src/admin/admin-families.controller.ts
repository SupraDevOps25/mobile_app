import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminFamiliesService } from './admin-families.service';
import { SearchFamiliesDto } from './dto/search-families.dto';

@ApiBearerAuth()
@ApiTags('Admin · Families')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/families')
export class AdminFamiliesController {
  constructor(private readonly service: AdminFamiliesService) {}

  @ApiOperation({
    summary: 'Admin: list families (search by name/email/phone)',
  })
  @Get()
  list(@Query() dto: SearchFamiliesDto) {
    return this.service.list(dto.q);
  }

  @ApiOperation({ summary: 'Admin: a family with all their subscriptions' })
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }
}
