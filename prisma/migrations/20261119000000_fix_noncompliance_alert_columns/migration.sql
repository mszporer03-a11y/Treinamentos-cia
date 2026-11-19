-- Repair drift: NonComplianceAlert pre-existed in production without these columns,
-- so CREATE TABLE IF NOT EXISTS in an earlier migration skipped them.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AlertStatus') THEN
    CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AlertSeverity') THEN
    CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
  END IF;
END $$;

ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "status" "AlertStatus" NOT NULL DEFAULT 'OPEN';
ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "resolution" TEXT;
