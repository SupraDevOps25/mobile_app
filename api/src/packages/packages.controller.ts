import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PackageType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PackagesService } from './packages.service';

@ApiBearerAuth()
@ApiTags('Packages')
@UseGuards(JwtAuthGuard)
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @ApiOperation({ summary: 'List the care package catalog' })
  @Get()
  findAll() {
    return this.packagesService.findAll();
  }

  @ApiOperation({ summary: 'Get a single package by type' })
  @Get(':type')
  findOne(@Param('type') type: PackageType) {
    return this.packagesService.findOne(type);
  }
}
