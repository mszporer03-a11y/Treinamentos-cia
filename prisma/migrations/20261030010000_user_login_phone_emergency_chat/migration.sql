-- Login (username) e telefone WhatsApp no cadastro + Chat Individual Emergencial
-- Idempotente (seguro para bancos que já tenham parte do schema ou um
-- registro de execução anterior que falhou)

DO $$ BEGIN
  CREATE TYPE "EmergencyStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

CREATE TABLE IF NOT EXISTS "EmergencyChat" (
    "id" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "storeId" TEXT,
    "openedById" TEXT,
    "closedById" TEXT,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "EmergencyChat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmergencyMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmergencyMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmergencyChat_franchiseeId_status_idx" ON "EmergencyChat"("franchiseeId", "status");

DO $$ BEGIN
  ALTER TABLE "EmergencyChat" ADD CONSTRAINT "EmergencyChat_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "EmergencyChat" ADD CONSTRAINT "EmergencyChat_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "EmergencyChat" ADD CONSTRAINT "EmergencyChat_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "EmergencyChat" ADD CONSTRAINT "EmergencyChat_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "EmergencyMessage" ADD CONSTRAINT "EmergencyMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "EmergencyChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "EmergencyMessage" ADD CONSTRAINT "EmergencyMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- No máximo uma sessão emergencial aberta por usuário
CREATE UNIQUE INDEX IF NOT EXISTS "EmergencyChat_one_open_per_franchisee" ON "EmergencyChat"("franchiseeId") WHERE "status" = 'OPEN';
