-- Tie each payout request to the subscription's monthly payment it covers.
-- (payout_requests is newly added and empty, so a NOT NULL column is safe.)
ALTER TABLE "payout_requests" ADD COLUMN "paymentId" TEXT NOT NULL;

CREATE UNIQUE INDEX "payout_requests_caregiverId_paymentId_key" ON "payout_requests"("caregiverId", "paymentId");

ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
