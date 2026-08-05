-- AlterTable
ALTER TABLE "coordinator_profiles" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "momoName" TEXT,
ADD COLUMN     "momoNetwork" TEXT,
ADD COLUMN     "momoNumber" TEXT,
ADD COLUMN     "payoutMethod" "PayoutMethod";
