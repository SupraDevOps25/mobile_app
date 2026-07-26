import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminCaregiversController } from './admin-caregivers.controller';
import { AdminCaregiversService } from './admin-caregivers.service';

// Admin portal API. Starts with caregiver verification (the onboarding
// unblock) and will grow to cover families, subscriptions, package requests,
// and visit-status overrides.
@Module({
  imports: [NotificationsModule],
  controllers: [AdminCaregiversController],
  providers: [AdminCaregiversService],
})
export class AdminModule {}
