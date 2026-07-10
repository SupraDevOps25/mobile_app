-- Self-uploaded profile photo on the User (for roles without a profile table).
ALTER TABLE "users" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "users" ADD COLUMN "photoPublicId" TEXT;
