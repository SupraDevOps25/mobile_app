import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminCaregiversService } from './admin-caregivers.service';
import { SetVerificationDto } from './dto/set-verification.dto';

@ApiBearerAuth()
@ApiTags('Admin · Caregivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/caregivers')
export class AdminCaregiversController {
  constructor(private readonly service: AdminCaregiversService) {}

  @ApiOperation({ summary: 'Admin: list caregivers (optionally by status)' })
  @Get()
  list(@Query('status') status?: VerificationStatus) {
    return this.service.list(status);
  }

  @ApiOperation({ summary: 'Admin: caregiver detail incl. uploaded documents' })
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @ApiOperation({ summary: 'Admin: approve or reject a caregiver' })
  @Patch(':id/verification')
  setVerification(@Param('id') id: string, @Body() dto: SetVerificationDto) {
    return this.service.setVerification(id, dto);
  }
}
