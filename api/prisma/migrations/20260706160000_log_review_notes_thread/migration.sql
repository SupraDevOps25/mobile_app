-- Replace the single coordinator review note with an accumulating thread of
-- change-request notes (oldest first).
ALTER TABLE "visit_logs" DROP COLUMN "reviewNote",
ADD COLUMN     "reviewNotes" TEXT[] DEFAULT ARRAY[]::TEXT[];
