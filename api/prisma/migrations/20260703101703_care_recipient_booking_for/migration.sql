-- CreateEnum
CREATE TYPE "BookingFor" AS ENUM ('SELF', 'LOVED_ONE');

-- AlterTable
ALTER TABLE "care_recipients" ADD COLUMN     "bookingFor" "BookingFor" NOT NULL DEFAULT 'LOVED_ONE';
