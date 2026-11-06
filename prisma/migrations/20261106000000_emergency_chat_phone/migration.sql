-- Telefone WhatsApp do usuário
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- Sessão do chat emergencial (aberta/encerrada somente pelo admin)
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "isOpen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "openedById" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);
