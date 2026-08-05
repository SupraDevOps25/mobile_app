import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PackageType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminPackagesService } from './admin-packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@ApiBearerAuth()
@ApiTags('Admin · Packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/packages')
export class AdminPackagesController {
  constructor(private readonly service: AdminPackagesService) {}

  @ApiOperation({ summary: 'Admin: list the care package catalog' })
  @Get()
  list() {
    return this.service.list();
  }

  @ApiOperation({ summary: 'Admin: create a package for an enum type' })
  @Post()
  create(@Body() dto: CreatePackageDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Admin: edit a package (name/tagline/price/incl.)' })
  @Patch(':type')
  update(@Param('type') type: PackageType, @Body() dto: UpdatePackageDto) {
    return this.service.update(type, dto);
  }

  @ApiOperation({ summary: 'Admin: remove a package from the catalog' })
  @Delete(':type')
  remove(@Param('type') type: PackageType) {
    return this.service.remove(type);
  }
}
