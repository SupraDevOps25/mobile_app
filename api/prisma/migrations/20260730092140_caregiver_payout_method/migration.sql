-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('MOMO', 'BANK');

-- AlterTable
ALTER TABLE "caregiver_profiles" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "momoName" TEXT,
ADD COLUMN     "momoNetwork" TEXT,
ADD COLUMN     "momoNumber" TEXT,
ADD COLUMN     "payoutMethod" "PayoutMethod";

-- AlterTable
ALTER TABLE "visit_logs" ALTER COLUMN "reviewNotes" DROP DEFAULT;
