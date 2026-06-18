-- Reorganização do portal
-- Remove funcionalidades descontinuadas, refatora Não Conformidades → Registros,
-- e adiciona Comunicados + rastreio de visualização.

-- ── DROP de funcionalidades removidas (CASCADE resolve FKs e enums dependentes) ──
DROP TABLE IF EXISTS "ChecklistResponseItem" CASCADE;
DROP TABLE IF EXISTS "ChecklistResponse" CASCADE;
DROP TABLE IF EXISTS "ChecklistItem" CASCADE;
DROP TABLE IF EXISTS "ChecklistSection" CASCADE;
DROP TABLE IF EXISTS "ChecklistTemplate" CASCADE;

DROP TABLE IF EXISTS "EmployeeTraining" CASCADE;
DROP TABLE IF EXISTS "WorkShift" CASCADE;
DROP TABLE IF EXISTS "WorkSchedule" CASCADE;
DROP TABLE IF EXISTS "Employee" CASCADE;

DROP TABLE IF EXISTS "SupplyRequestItem" CASCADE;
DROP TABLE IF EXISTS "SupplyRequest" CASCADE;

DROP TABLE IF EXISTS "CampaignAsset" CASCADE;
DROP TABLE IF EXISTS "MarketingCampaign" CASCADE;

DROP TABLE IF EXISTS "FranchiseeDocument" CASCADE;

-- ── DROP de enums órfãos ──
DROP TYPE IF EXISTS "EmployeeRole";
DROP TYPE IF EXISTS "ShiftType";
DROP TYPE IF EXISTS "SupplyStatus";
DROP TYPE IF EXISTS "SupplyCategory";
DROP TYPE IF EXISTS "DocCategory";

-- ── Registros (antiga NonComplianceAlert): remove severidade/prazo, adiciona mídia ──
ALTER TABLE "NonComplianceAlert" DROP COLUMN IF EXISTS "severity";
ALTER TABLE "NonComplianceAlert" DROP COLUMN IF EXISTS "status";
ALTER TABLE "NonComplianceAlert" DROP COLUMN IF EXISTS "dueDate";
ALTER TABLE "NonComplianceAlert" DROP COLUMN IF EXISTS "resolution";
ALTER TABLE "NonComplianceAlert" ADD COLUMN "fileUrl" TEXT;
ALTER TABLE "NonComplianceAlert" ADD COLUMN "fileKey" TEXT;
ALTER TABLE "NonComplianceAlert" ADD COLUMN "fileName" TEXT;
ALTER TABLE "NonComplianceAlert" ADD COLUMN "fileType" TEXT;

DROP TYPE IF EXISTS "AlertSeverity";
DROP TYPE IF EXISTS "AlertStatus";

-- ── AlertView (quem visualizou cada Registro) ──
CREATE TABLE "AlertView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertView_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AlertView_userId_alertId_key" ON "AlertView"("userId", "alertId");
ALTER TABLE "AlertView" ADD CONSTRAINT "AlertView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlertView" ADD CONSTRAINT "AlertView_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "NonComplianceAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Comunicado (aviso geral admin → rede) ──
CREATE TABLE "Comunicado" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comunicado_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── ComunicadoView (quem leu cada comunicado) ──
CREATE TABLE "ComunicadoView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comunicadoId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComunicadoView_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ComunicadoView_userId_comunicadoId_key" ON "ComunicadoView"("userId", "comunicadoId");
ALTER TABLE "ComunicadoView" ADD CONSTRAINT "ComunicadoView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComunicadoView" ADD CONSTRAINT "ComunicadoView_comunicadoId_fkey" FOREIGN KEY ("comunicadoId") REFERENCES "Comunicado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
