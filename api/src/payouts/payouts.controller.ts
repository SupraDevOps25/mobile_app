import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PayoutStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PayoutsService } from './payouts.service';

@ApiBearerAuth()
@ApiTags('Payouts (admin)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/payouts')
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @ApiOperation({
    summary: 'Admin: list payout requests (optionally by status)',
  })
  @Get()
  list(@Query('status') status?: PayoutStatus) {
    const valid =
      status === PayoutStatus.PENDING || status === PayoutStatus.PAID
        ? status
        : undefined;
    return this.payouts.list(valid);
  }

  @ApiOperation({ summary: 'Admin: mark a payout as paid (disbursed)' })
  @Patch(':id/paid')
  markPaid(@Param('id') id: string) {
    return this.payouts.markPaid(id);
  }
}
