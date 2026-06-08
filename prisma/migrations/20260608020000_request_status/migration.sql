-- Add RequestStatus enum and field to Message
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'SEEN', 'IN_PROGRESS', 'DONE');
ALTER TABLE "Message" ADD COLUMN "requestStatus" "RequestStatus";
-- Backfill: all existing quick-request messages become PENDING
UPDATE "Message" SET "requestStatus" = 'PENDING' WHERE category IS NOT NULL;
