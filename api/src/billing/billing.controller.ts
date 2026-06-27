import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { BillingService } from './billing.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Coordinator: issue a month-end invoice' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Post('invoices/:subscriptionId')
  issue(
    @Request() req: { user: { id: string } },
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.billingService.issueInvoice(req.user.id, subscriptionId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Family: list my invoices' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('FAMILY')
  @Get('invoices')
  list(@Request() req: { user: { id: string } }) {
    return this.billingService.listInvoices(req.user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Family: pay an invoice (initialize Paystack)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('FAMILY')
  @Post('invoices/:paymentId/pay')
  pay(
    @Request() req: { user: { id: string } },
    @Param('paymentId') paymentId: string,
  ) {
    return this.billingService.pay(req.user.id, paymentId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Family: verify a payment after callback' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('FAMILY')
  @Post('verify')
  verify(@Body() dto: VerifyPaymentDto) {
    return this.billingService.verify(dto.reference);
  }

  @ApiOperation({ summary: 'Paystack webhook (HMAC verified)' })
  @Post('webhook')
  webhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<ExpressRequest>,
  ) {
    return this.billingService.handleWebhook(signature, req.rawBody as Buffer);
  }
}
