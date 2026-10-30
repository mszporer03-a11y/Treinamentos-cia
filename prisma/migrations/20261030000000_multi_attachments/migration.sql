-- Múltiplos anexos por post (mosaico estilo WhatsApp), idempotente
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
