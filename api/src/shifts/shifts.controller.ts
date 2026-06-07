import {
  Body,
  Controller,
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
import { CancelShiftDto } from './dto/cancel-shift.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { InstantBookDto } from './dto/instant-book.dto';
import { ShiftsService } from './shifts.service';

type AuthRequest = { user: { id: string; role: string } };

@ApiBearerAuth()
@ApiTags('Shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @ApiOperation({
    summary: 'Family instantly books a confirmed shift (bypasses availability-slot flow)',
  })
  @Roles('FAMILY')
  @Post('instant-book')
  instantBook(@Request() req: AuthRequest, @Body() dto: InstantBookDto) {
    return this.shiftsService.instantBook(req.user.id, dto);
  }

  @ApiOperation({
    summary: 'Family requests a shift from an availability slot',
  })
  @Roles('FAMILY')
  @Post()
  requestShift(@Request() req: AuthRequest, @Body() dto: CreateShiftDto) {
    return this.shiftsService.requestShift(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Get all shifts for the logged-in user' })
  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.shiftsService.findAll(req.user.id, req.user.role);
  }

  @ApiOperation({ summary: 'Caregiver accepts a pending shift' })
  @Roles('CAREGIVER')
  @Patch(':id/accept')
  accept(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.shiftsService.accept(id, req.user.id);
  }

  @ApiOperation({ summary: 'Caregiver declines a pending shift' })
  @Roles('CAREGIVER')
  @Patch(':id/decline')
  decline(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.shiftsService.decline(id, req.user.id);
  }

  @ApiOperation({
    summary: 'Cancel a shift (family or caregiver, reason required)',
  })
  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: CancelShiftDto,
  ) {
    return this.shiftsService.cancel(id, req.user.id, dto);
  }
}
