-- Múltiplos anexos por post (mosaico estilo WhatsApp).
-- Idempotente e tolerante a tabelas inexistentes: o banco compartilhado pode
-- já ter removido tabelas em reorganizações (ex.: MarketingCampaign).

DO $$ BEGIN
  IF to_regclass('"Material"') IS NOT NULL THEN
    ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
  END IF;
  IF to_regclass('"Message"') IS NOT NULL THEN
    ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
    ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "adminReplyAttachments" JSONB NOT NULL DEFAULT '[]';
  END IF;
  IF to_regclass('"Comunicado"') IS NOT NULL THEN
    ALTER TABLE "Comunicado" ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
  END IF;
  IF to_regclass('"NonComplianceAlert"') IS NOT NULL THEN
    ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
  END IF;
  IF to_regclass('"OnboardingStep"') IS NOT NULL THEN
    ALTER TABLE "OnboardingStep" ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
  END IF;
END $$;
