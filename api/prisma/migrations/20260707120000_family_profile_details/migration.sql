-- AlterTable
ALTER TABLE "family_profiles" ADD COLUMN     "gender" "Gender",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "photoPublicId" TEXT;
