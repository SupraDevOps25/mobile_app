-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notifyPush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifySms" BOOLEAN NOT NULL DEFAULT true;
