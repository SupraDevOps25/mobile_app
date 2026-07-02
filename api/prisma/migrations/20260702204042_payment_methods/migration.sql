-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "authorizationCode" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "bank" TEXT,
    "expMonth" TEXT,
    "expYear" TEXT,
    "reusable" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_authorizationCode_key" ON "payment_methods"("authorizationCode");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
