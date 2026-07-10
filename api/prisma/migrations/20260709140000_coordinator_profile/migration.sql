-- Care Coordinator profile (personal + professional details).
CREATE TABLE "coordinator_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "workplace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinator_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coordinator_profiles_userId_key" ON "coordinator_profiles"("userId");

ALTER TABLE "coordinator_profiles" ADD CONSTRAINT "coordinator_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
