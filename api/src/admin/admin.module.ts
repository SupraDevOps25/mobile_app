import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminCaregiversController } from './admin-caregivers.controller';
import { AdminCaregiversService } from './admin-caregivers.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

// Admin portal API. Caregiver verification (the onboarding unblock), a user
// search used by the notification recipient picker, and growing from there.
@Module({
  imports: [MailModule, NotificationsModule],
  controllers: [AdminCaregiversController, AdminUsersController],
  providers: [AdminCaregiversService, AdminUsersService],
})
export class AdminModule {}
