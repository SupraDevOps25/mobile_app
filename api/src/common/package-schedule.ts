import { PackageType } from '@prisma/client';

/**
 * Visit cadence per package — the single source of truth used both to
 * auto-generate a month's schedule (subscriptions) and to describe the daily
 * commitment on a nurse's offer (assignments).
 *
 * Per company policy every care visit starts in the morning (8:00 AM by
 * default) and runs for `durationHrs`. `count` visits are placed across the
 * month, one every `intervalDays`.
 */
export type PackageVisitSpec = {
  count: number;
  durationHrs: number;
  intervalDays: number;
};

export const PACKAGE_SCHEDULE: Record<PackageType, PackageVisitSpec> = {
  WELLNESS: { count: 4, durationHrs: 2, intervalDays: 7 },
  DAILY_ASSIST: { count: 26, durationHrs: 8, intervalDays: 1 },
  EXTENDED_ASSIST: { count: 26, durationHrs: 12, intervalDays: 1 },
  LIVE_IN: { count: 30, durationHrs: 24, intervalDays: 1 },
};
