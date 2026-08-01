import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminCaregiversController } from './admin-caregivers.controller';
import { AdminCaregiversService } from './admin-caregivers.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminVisitsController } from './admin-visits.controller';
import { AdminVisitsService } from './admin-visits.service';

// Admin portal API. Caregiver verification (the onboarding unblock), a user
// search for the notification recipient picker, visit lookup for status
// overrides, and growing from there.
@Module({
  imports: [MailModule, NotificationsModule],
  controllers: [
    AdminCaregiversController,
    AdminUsersController,
    AdminVisitsController,
  ],
  providers: [AdminCaregiversService, AdminUsersService, AdminVisitsService],
})
export class AdminModule {}
