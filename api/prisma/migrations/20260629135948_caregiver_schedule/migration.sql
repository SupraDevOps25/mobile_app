-- AlterTable
ALTER TABLE "caregiver_profiles" ADD COLUMN     "maxVisitsPerDay" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "workEnd" TEXT NOT NULL DEFAULT '17:00',
ADD COLUMN     "workStart" TEXT NOT NULL DEFAULT '08:00',
ADD COLUMN     "workingDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[];
