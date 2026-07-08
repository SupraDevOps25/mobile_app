-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_subscriptionId_caregiverId_key" ON "reviews"("subscriptionId", "caregiverId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "caregiver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
