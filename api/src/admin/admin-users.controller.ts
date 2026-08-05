import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminUsersService } from './admin-users.service';
import { BanUserDto } from './dto/ban-user.dto';
import { SearchUsersDto } from './dto/search-users.dto';

@ApiBearerAuth()
@ApiTags('Admin · Users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @ApiOperation({ summary: 'Admin: list/search users (status + last login)' })
  @Get()
  search(@Query() dto: SearchUsersDto) {
    return this.service.search(dto.q, dto.role);
  }

  @ApiOperation({ summary: 'Admin: ban or un-ban a user' })
  @Patch(':id/ban')
  setBanned(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: BanUserDto,
  ) {
    return this.service.setBanned(req.user.id, id, dto.banned, dto.reason);
  }

  @ApiOperation({ summary: 'Admin: permanently delete a user' })
  @Delete(':id')
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
