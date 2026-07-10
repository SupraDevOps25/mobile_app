import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssignmentsModule } from './assignments/assignments.module';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { CaregiversModule } from './caregivers/caregivers.module';
import { CoordinatorsModule } from './coordinators/coordinators.module';
import { FamilyModule } from './family/family.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PackagesModule } from './packages/packages.module';
import { PayoutsModule } from './payouts/payouts.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StorageModule } from './storage/storage.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { VisitsModule } from './visits/visits.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    AuthModule,
    NotificationsModule,
    PackagesModule,
    SubscriptionsModule,
    AssignmentsModule,
    CaregiversModule,
    VisitsModule,
    BillingModule,
    FamilyModule,
    CoordinatorsModule,
    ReviewsModule,
    MessagesModule,
    PayoutsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
