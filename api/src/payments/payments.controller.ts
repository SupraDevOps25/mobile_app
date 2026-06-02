import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentsService } from './payments.service';

type AuthRequest = { user: { id: string } };

@ApiBearerAuth()
@ApiTags('Payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({
    summary: 'Family initializes a Paystack payment for a confirmed shift',
  })
  @Roles('FAMILY')
  @Post('initialize')
  initialize(@Request() req: AuthRequest, @Body() dto: InitializePaymentDto) {
    return this.paymentsService.initialize(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Verify a payment using its Paystack reference' })
  @Roles('FAMILY')
  @Post('verify')
  verify(@Request() req: AuthRequest, @Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verify(req.user.id, dto.reference);
  }

  @ApiOperation({ summary: 'Paystack webhook — do not call manually' })
  // No JWT guard — Paystack calls this directly, we verify using HMAC signature
  @UseGuards()
  @Post('webhook')
  webhook(
    @Request() req: { rawBody?: Buffer },
    @Headers('x-paystack-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody!, signature);
  }

  @ApiOperation({ summary: 'Get payment status for a shift' })
  @Roles('FAMILY')
  @Get('shift/:shiftId')
  getByShift(@Param('shiftId') shiftId: string, @Request() req: AuthRequest) {
    return this.paymentsService.getPaymentByShift(shiftId, req.user.id);
  }
}
