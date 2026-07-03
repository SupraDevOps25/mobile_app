import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateAddressDto, UpdateAddressDto } from './dto/save-address.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FamilyService } from './family.service';

@ApiBearerAuth()
@ApiTags('Family')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @ApiOperation({ summary: 'Family: profile headline stats' })
  @Roles('FAMILY')
  @Get('stats')
  stats(@Request() req: { user: { id: string } }) {
    return this.familyService.stats(req.user.id);
  }

  @ApiOperation({ summary: 'Family: my personal details' })
  @Roles('FAMILY')
  @Get('me')
  me(@Request() req: { user: { id: string } }) {
    return this.familyService.me(req.user.id);
  }

  @ApiOperation({ summary: 'Family: update my personal details' })
  @Roles('FAMILY')
  @Patch('me')
  updateMe(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateFamilyDto,
  ) {
    return this.familyService.updateMe(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Family: permanently delete my account and data' })
  @Roles('FAMILY')
  @Delete('me')
  deleteAccount(@Request() req: { user: { id: string } }) {
    return this.familyService.deleteAccount(req.user.id);
  }

  // ── Saved addresses ───────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Family: list my saved addresses' })
  @Roles('FAMILY')
  @Get('addresses')
  listAddresses(@Request() req: { user: { id: string } }) {
    return this.familyService.listAddresses(req.user.id);
  }

  @ApiOperation({ summary: 'Family: save a new address' })
  @Roles('FAMILY')
  @Post('addresses')
  createAddress(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateAddressDto,
  ) {
    return this.familyService.createAddress(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Family: update a saved address' })
  @Roles('FAMILY')
  @Patch('addresses/:id')
  updateAddress(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.familyService.updateAddress(req.user.id, id, dto);
  }

  @ApiOperation({ summary: 'Family: delete a saved address' })
  @Roles('FAMILY')
  @Delete('addresses/:id')
  deleteAddress(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.familyService.deleteAddress(req.user.id, id);
  }

  // ── Payment methods ───────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Family: list my saved payment methods' })
  @Roles('FAMILY')
  @Get('payment-methods')
  listPaymentMethods(@Request() req: { user: { id: string } }) {
    return this.familyService.listPaymentMethods(req.user.id);
  }

  @ApiOperation({ summary: 'Family: set a payment method as default' })
  @Roles('FAMILY')
  @Patch('payment-methods/:id/default')
  setDefaultPaymentMethod(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.familyService.setDefaultPaymentMethod(req.user.id, id);
  }

  @ApiOperation({ summary: 'Family: remove a saved payment method' })
  @Roles('FAMILY')
  @Delete('payment-methods/:id')
  deletePaymentMethod(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.familyService.deletePaymentMethod(req.user.id, id);
  }
}
