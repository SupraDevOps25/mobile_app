import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PaystackService } from './paystack.service';

@Module({
  imports: [MailModule, NotificationsModule],
  controllers: [BillingController],
  providers: [BillingService, PaystackService],
  exports: [BillingService],
})
export class BillingModule {}
