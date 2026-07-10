-- Nurse payout requests.
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID');

CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "amountGhs" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payout_requests_caregiverId_idx" ON "payout_requests"("caregiverId");

ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "caregiver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
