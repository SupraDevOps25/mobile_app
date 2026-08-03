import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminCaregiversController } from './admin-caregivers.controller';
import { AdminCaregiversService } from './admin-caregivers.service';
import { AdminFamiliesController } from './admin-families.controller';
import { AdminFamiliesService } from './admin-families.service';
import { AdminPackagesController } from './admin-packages.controller';
import { AdminPackagesService } from './admin-packages.service';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService } from './admin-stats.service';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminVisitsController } from './admin-visits.controller';
import { AdminVisitsService } from './admin-visits.service';

// Admin portal API. Caregiver verification (the onboarding unblock), a user
// search for the notification recipient picker, visit lookup for status
// overrides, family/subscription read views, catalog management, and growing.
@Module({
  imports: [MailModule, NotificationsModule],
  controllers: [
    AdminAnalyticsController,
    AdminCaregiversController,
    AdminFamiliesController,
    AdminPackagesController,
    AdminStatsController,
    AdminSubscriptionsController,
    AdminUsersController,
    AdminVisitsController,
  ],
  providers: [
    AdminAnalyticsService,
    AdminCaregiversService,
    AdminFamiliesService,
    AdminPackagesService,
    AdminStatsService,
    AdminSubscriptionsService,
    AdminUsersService,
    AdminVisitsService,
  ],
})
export class AdminModule {}
