import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PackageType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePackageRequestDto } from './dto/create-package-request.dto';
import { PackagesService } from './packages.service';

@ApiBearerAuth()
@ApiTags('Packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @ApiOperation({ summary: 'List the care package catalog' })
  @Get()
  findAll() {
    return this.packagesService.findAll();
  }

  @ApiOperation({
    summary: 'Family: no catalog package fits — tell us what you need',
  })
  @Roles('FAMILY')
  @Post('requests')
  requestCustom(
    @Request() req: { user: { id: string } },
    @Body() dto: CreatePackageRequestDto,
  ) {
    return this.packagesService.requestCustom(req.user.id, dto.message);
  }

  @ApiOperation({ summary: 'Get a single package by type' })
  @Get(':type')
  findOne(@Param('type') type: PackageType) {
    return this.packagesService.findOne(type);
  }
}
