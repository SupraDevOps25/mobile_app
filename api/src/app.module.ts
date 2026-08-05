import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
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
    // Global IP rate limiting. The default is a generous backstop against
    // pathological abuse — kept high so normal polling and carrier-grade NAT
    // (many mobile users sharing one public IP) aren't throttled. Sensitive
    // auth routes set their own tighter @Throttle limits.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule,
    StorageModule,
    AuthModule,
    NotificationsModule,
    AdminModule,
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
  providers: [
    AppService,
    // Enforce the throttler on every route (auth routes tighten it per-handler).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
