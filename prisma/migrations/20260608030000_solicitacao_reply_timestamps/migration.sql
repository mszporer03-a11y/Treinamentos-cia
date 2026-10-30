-- Add status timestamps and admin reply fields to Message
ALTER TABLE "Message" ADD COLUMN "seenAt"             TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN "inProgressAt"       TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN "doneAt"             TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN "adminReplyContent"  TEXT;
ALTER TABLE "Message" ADD COLUMN "adminReplyFileUrl"  TEXT;
ALTER TABLE "Message" ADD COLUMN "adminReplyFileKey"  TEXT;
ALTER TABLE "Message" ADD COLUMN "adminReplyFileName" TEXT;
ALTER TABLE "Message" ADD COLUMN "adminReplyFileType" TEXT;
