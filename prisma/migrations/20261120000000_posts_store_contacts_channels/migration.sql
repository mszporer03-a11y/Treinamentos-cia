-- Itens 1-3: capa (thumbnail) dos posts
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "coverUrl" TEXT;
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "coverKey" TEXT;

-- Itens 6 / 11: contato individual e pin personalizável por loja
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "contactName" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "pinColor" TEXT DEFAULT '#EA580C';

-- Item 6: canal exclusivo por loja (conversa por usuário + loja)
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
DROP INDEX IF EXISTS "Conversation_franchiseeId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_franchiseeId_storeId_key" ON "Conversation"("franchiseeId", "storeId");
CREATE INDEX IF NOT EXISTS "Conversation_storeId_idx" ON "Conversation"("storeId");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Conversation_storeId_fkey') THEN
    ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_storeId_fkey"
      FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
