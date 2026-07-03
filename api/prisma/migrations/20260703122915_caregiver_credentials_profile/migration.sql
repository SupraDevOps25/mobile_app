-- CreateEnum
CREATE TYPE "CaregiverDocumentType" AS ENUM ('GHANA_CARD', 'PIN_CARD');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "caregiver_profiles" ADD COLUMN     "hasHomecareExp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "photoPublicId" TEXT,
ADD COLUMN     "photoUrl" TEXT;

-- CreateTable
CREATE TABLE "caregiver_documents" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "type" "CaregiverDocumentType" NOT NULL,
    "idNumber" TEXT,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caregiver_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "caregiver_documents_caregiverId_type_key" ON "caregiver_documents"("caregiverId", "type");

-- AddForeignKey
ALTER TABLE "caregiver_documents" ADD CONSTRAINT "caregiver_documents_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "caregiver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
