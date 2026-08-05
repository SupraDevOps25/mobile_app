import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { ReassignNurseDto } from './dto/reassign-nurse.dto';
import { SearchSubscriptionsDto } from './dto/search-subscriptions.dto';
import { UpdateRecipientDto } from './dto/update-recipient.dto';

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

  @ApiOperation({ summary: 'Admin: force-cancel a case' })
  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @ApiOperation({ summary: 'Admin: edit the case care recipient' })
  @Patch(':id/recipient')
  updateRecipient(@Param('id') id: string, @Body() dto: UpdateRecipientDto) {
    return this.service.updateRecipient(id, dto);
  }

  @ApiOperation({ summary: 'Admin: assign a specific nurse to a case' })
  @Post(':id/reassign-nurse')
  reassignNurse(@Param('id') id: string, @Body() dto: ReassignNurseDto) {
    return this.service.reassignNurse(id, dto);
  }
}
