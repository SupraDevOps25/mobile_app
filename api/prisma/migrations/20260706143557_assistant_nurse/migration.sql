-- AlterEnum
ALTER TYPE "AssignmentRole" ADD VALUE 'ASSISTANT';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "needsAssistant" BOOLEAN NOT NULL DEFAULT false;
