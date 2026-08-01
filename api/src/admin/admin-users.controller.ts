import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminUsersService } from './admin-users.service';
import { SearchUsersDto } from './dto/search-users.dto';

@ApiBearerAuth()
@ApiTags('Admin · Users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @ApiOperation({ summary: 'Admin: search users by name / email / phone' })
  @Get()
  search(@Query() dto: SearchUsersDto) {
    return this.service.search(dto.q, dto.role);
  }
}
