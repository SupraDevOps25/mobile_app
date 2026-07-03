-- AlterTable
ALTER TABLE "caregiver_profiles" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender";

-- AlterTable
ALTER TABLE "visit_logs" ADD COLUMN     "changesRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewNote" TEXT;
