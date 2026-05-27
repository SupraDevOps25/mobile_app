# Supracarer MVP Roadmap

## Project Overview

Supracarer is a caregiver scheduling and shift management platform designed to help families book caregivers while reducing no-shows and scheduling disruptions.

This MVP focuses on solving:

- Caregiver availability management
- Shift booking and confirmation
- Cancellation handling
- Automatic backup caregiver suggestions
- Notifications and alerts
- Payment collection and verification

Target Pilot Market:

- Ghana

Timeline:

- Start: May 19, 2026
- Launch Target: June 15, 2026

---

# MVP Goals

Build a reliable scheduling platform that allows:

1. Caregivers to publish availability.
2. Families to request shifts.
3. Caregivers to accept or decline shifts.
4. Families to receive replacement caregiver suggestions after cancellations.
5. Users to receive notifications.
6. Payments to be collected and verified through Paystack.

---

# In Scope

## Authentication

- Family account registration
- Caregiver account registration
- Login
- Role-based authorization

## Scheduling

- Availability calendar
- Publish availability
- View availability
- Shift request flow
- Shift acceptance flow
- Shift decline flow

## Booking Management

- Booking creation
- Booking confirmation
- Booking cancellation
- Cancellation reason capture

## Backup Pool

- Replacement caregiver suggestions
- Ranking by:
  - Proximity
  - Rating
  - Care-type compatibility

## Notifications

- Push notifications
- Booking alerts
- Cancellation alerts
- WhatsApp fallback notifications

## Payments

- Paystack checkout
- Transaction initialization
- Payment verification
- Webhook processing
- Payment status synchronization

## Offline Support

- Schedule viewing
- Caregiver profile viewing

---

# Out of Scope

The following features MUST NOT be built during MVP:

- Medical records
- AI caregiver matching
- Desktop web application
- Multi-country rollout
- Advanced analytics
- Video consultation
- Care plans

---

# Recommended Tech Stack

## Mobile

- React Native
- Expo

## Backend

- Node.js
- TypeScript
- NestJS

## Database

Recommended:

- PostgreSQL

## Cache

- Redis (Upstash)

## Notifications

Suggested providers:

- Firebase Cloud Messaging (FCM)
- Expo Push Notifications

## WhatsApp

Suggested:

- Meta WhatsApp Business API
- Twilio WhatsApp

## Payments

- Paystack

---

# Architecture Principles

Follow:

- Clean Architecture
- Domain-Driven Design
- Modular NestJS Modules
- Repository Pattern
- DTO Validation
- Event-Driven Notifications

Future services should be separable into microservices.

---

# Core Domain Modules

## Auth Module

Responsibilities:

- Registration
- Login
- JWT issuance
- Role permissions

Entities:

- User
- Role

---

## Caregiver Module

Responsibilities:

- Caregiver profile
- Verification status
- Availability management

Entities:

- Caregiver
- AvailabilitySlot

---

## Family Module

Responsibilities:

- Family profile
- Booking requests

Entities:

- Family

---

## Shift Module

Responsibilities:

- Shift creation
- Shift requests
- Shift acceptance
- Shift decline
- Shift status management

Entities:

- Shift
- ShiftAssignment

---

## Cancellation Module

Responsibilities:

- Cancellation workflow
- Reason capture
- Trigger replacement search

Entities:

- Cancellation

---

## Backup Pool Module

Responsibilities:

- Find substitute caregivers

Ranking Factors:

1. Distance
2. Rating
3. Care-type match

---

## Notification Module

Responsibilities:

- Push notifications
- WhatsApp fallback
- Alert delivery

---

## Payment Module

Responsibilities:

- Initialize transactions
- Verify payments
- Handle Paystack webhooks

Entities:

- Payment
- Transaction

---

# Week 1 Deliverables

## Planning & Foundation

### Tasks

- [ ] Finalize MVP scope
- [ ] Finalize wireframes
- [ ] Define API contracts
- [ ] Design database schema
- [ ] Configure repositories
- [ ] Setup CI/CD
- [ ] Setup environments

### Acceptance Criteria

- MVP scope approved
- Architecture approved
- Backlog finalized
- No critical blockers

---

# Week 2 Deliverables

## Core Build Sprint 1

### Authentication

- [ ] Family signup
- [ ] Caregiver signup
- [ ] Login
- [ ] JWT authentication

### Availability

- [ ] Create availability
- [ ] Update availability
- [ ] Availability APIs
- [ ] Availability screens

### Booking

- [ ] Request shift
- [ ] Accept shift
- [ ] Decline shift
- [ ] Enforce 2-hour response SLA

### Notifications

- [ ] Push notification baseline

### Payments

- [ ] Paystack initialization endpoint
- [ ] Store payment intent

### Acceptance Criteria

Family can:

- Discover caregiver availability
- Request a shift

Caregiver can:

- Accept request
- Decline request

Both dashboards update correctly.

---

# Week 3 Deliverables

## Core Build Sprint 2 + Reliability

### Cancellations

- [ ] Cancellation endpoint
- [ ] Cancellation reason required

### Backup Pool

- [ ] Replacement recommendation engine

Ranking:

- Proximity
- Rating
- Care-type match

### Notifications

- [ ] Critical alert pipeline
- [ ] WhatsApp fallback

### Offline Support

- [ ] Offline schedules
- [ ] Offline caregiver profiles

### Payments

- [ ] Verification endpoint
- [ ] Webhook processing
- [ ] Payment status sync

### Acceptance Criteria

- Cancellation alerts sent within 60 seconds
- Backup suggestions appear within 2 minutes

---

# Week 4 Deliverables

## QA, UAT & Launch

### QA

- [ ] Integration testing
- [ ] Regression testing
- [ ] Bug fixes

### Security

- [ ] Credential hardening
- [ ] Access control review

### UAT

- [ ] Closed beta
- [ ] Pilot testing

### Deployment

- [ ] Production backend deployment
- [ ] Android MVP release

### Payments

Test scenarios:

- Success
- Pending
- Failed
- Abandoned
- Webhook retries

### Acceptance Criteria

Pilot users can:

- Book shifts
- Confirm shifts
- Cancel shifts
- Replace caregivers

Launch checklist completed.

---

# API Requirements

## Auth

### POST /auth/register

### POST /auth/login

### GET /auth/profile

---

## Availability

### POST /availability

### GET /availability

### PATCH /availability/:id

---

## Shifts

### POST /shifts

### GET /shifts

### PATCH /shifts/:id/accept

### PATCH /shifts/:id/decline

### PATCH /shifts/:id/cancel

---

## Backup Pool

### GET /backup-suggestions/:shiftId

---

## Notifications

### POST /notifications/send

---

## Payments

### POST /payments/initialize

### POST /payments/verify

### POST /payments/webhook

---

# Deployment Targets

## Preferred

Backend

- Sevalla

Database

- PostgreSQL

Cache

- Upstash Redis

Mobile

- Expo EAS
- Google Play Closed Testing

---

## Free Tier Alternative

Backend

- Render
- Koyeb

Database

- Supabase

Cache

- Upstash Free

Storage

- Cloudflare R2

Mobile

- Expo EAS Free

---

# Key Metrics

Track immediately after launch:

- Total booked shifts
- Shift completion rate
- Cancellation rate
- Backup fill rate
- Caregiver response time
- Payment success rate
- User satisfaction score
- NPS

---

# Risks

## Caregiver Churn

Mitigation:

- Improve backup pool quality
- Enforce response SLAs

## Verification Adoption

Mitigation:

- Lightweight onboarding
- Trust badge incentives

## Connectivity Issues

Mitigation:

- Offline-first design
- Local caching
- Low-bandwidth optimization

---

# Definition of MVP Success

The MVP is successful if pilot users can:

1. Register and authenticate.
2. Publish caregiver availability.
3. Request shifts.
4. Accept or decline shifts.
5. Cancel shifts.
6. Receive backup caregiver suggestions.
7. Receive notifications.
8. Complete payments.
9. Operate reliably in the Ghana pilot environment.