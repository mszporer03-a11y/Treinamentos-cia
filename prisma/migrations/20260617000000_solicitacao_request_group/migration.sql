-- AlterTable
ALTER TABLE "Message" ADD COLUMN "requestGroupId" TEXT;

-- CreateIndex
CREATE INDEX "Message_requestGroupId_idx" ON "Message"("requestGroupId");
