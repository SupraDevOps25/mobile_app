-- Care Coordinator payout requests (their 8% fee per completed subscription month).
CREATE TABLE "coordinator_payout_requests" (
    "id" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountGhs" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "coordinator_payout_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coordinator_payout_requests_coordinatorId_paymentId_key" ON "coordinator_payout_requests"("coordinatorId", "paymentId");

CREATE INDEX "coordinator_payout_requests_coordinatorId_idx" ON "coordinator_payout_requests"("coordinatorId");

ALTER TABLE "coordinator_payout_requests" ADD CONSTRAINT "coordinator_payout_requests_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coordinator_payout_requests" ADD CONSTRAINT "coordinator_payout_requests_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
