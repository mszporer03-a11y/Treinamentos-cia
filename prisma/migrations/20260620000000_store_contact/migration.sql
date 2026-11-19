-- Contato individual por loja (idempotente)
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "contactName" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "email" TEXT;
