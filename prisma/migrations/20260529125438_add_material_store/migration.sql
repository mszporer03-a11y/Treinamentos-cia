-- CreateEnum
CREATE TYPE "SupplyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "SupplyCategory" AS ENUM ('INSUMOS', 'UNIFORMES', 'TALHERES', 'DESCARTAVEIS', 'OUTROS');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('CHURRASQUEIRO', 'AUXILIAR_CHURRASCO', 'CAIXA', 'GERENTE_OPERACIONAL', 'ASG', 'OUTRO');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('MANHA', 'TARDE', 'NOITE', 'INTEGRAL', 'FOLGA');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "DocCategory" AS ENUM ('CONTRATO', 'ADITIVO', 'PROCURACAO', 'ALVARA', 'CERTIFICADO', 'OUTRO');

-- CreateEnum
CREATE TYPE "OnboardingPhase" AS ENUM ('OBRAS', 'EQUIPAMENTOS', 'TREINAMENTO', 'APROVACAO');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "MaterialStore" (
    "materialId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "MaterialStore_pkey" PRIMARY KEY ("materialId","storeId")
);

-- CreateTable
CREATE TABLE "MessageStore" (
    "messageId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "MessageStore_pkey" PRIMARY KEY ("messageId","storeId")
);

-- CreateTable
CREATE TABLE "SupplyRequest" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "SupplyStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "category" "SupplyCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'un',

    CONSTRAINT "SupplyRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "EmployeeRole" NOT NULL DEFAULT 'OUTRO',
    "contact" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkShift" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "type" "ShiftType" NOT NULL DEFAULT 'MANHA',
    "startTime" TEXT,
    "endTime" TEXT,

    CONSTRAINT "WorkShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTraining" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "EmployeeTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NonComplianceAlert" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonComplianceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignAsset" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyOption" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SurveyOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FranchiseeDocument" (
    "id" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "DocCategory" NOT NULL DEFAULT 'OUTRO',
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FranchiseeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KiloPrice" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "suggestedById" TEXT,
    "suggestedNote" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KiloPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreOnboarding" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "isNewStore" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingStep" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "phase" "OnboardingPhase" NOT NULL,
    "responsible" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppTutorialSeen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppTutorialSeen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistSection" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChecklistSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistResponse" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistResponseItem" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "ChecklistResponseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_storeId_weekStart_key" ON "WorkSchedule"("storeId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "WorkShift_scheduleId_employeeId_dayIndex_key" ON "WorkShift"("scheduleId", "employeeId", "dayIndex");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTraining_employeeId_materialId_key" ON "EmployeeTraining"("employeeId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_surveyId_userId_key" ON "SurveyResponse"("surveyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreOnboarding_storeId_key" ON "StoreOnboarding"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "AppTutorialSeen_userId_key" ON "AppTutorialSeen"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistResponseItem_responseId_itemId_key" ON "ChecklistResponseItem"("responseId", "itemId");

-- AddForeignKey
ALTER TABLE "MaterialStore" ADD CONSTRAINT "MaterialStore_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialStore" ADD CONSTRAINT "MaterialStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageStore" ADD CONSTRAINT "MessageStore_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageStore" ADD CONSTRAINT "MessageStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyRequest" ADD CONSTRAINT "SupplyRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyRequest" ADD CONSTRAINT "SupplyRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyRequestItem" ADD CONSTRAINT "SupplyRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SupplyRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkShift" ADD CONSTRAINT "WorkShift_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "WorkSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkShift" ADD CONSTRAINT "WorkShift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTraining" ADD CONSTRAINT "EmployeeTraining_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTraining" ADD CONSTRAINT "EmployeeTraining_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonComplianceAlert" ADD CONSTRAINT "NonComplianceAlert_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAsset" ADD CONSTRAINT "CampaignAsset_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyOption" ADD CONSTRAINT "SurveyOption_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "SurveyOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseeDocument" ADD CONSTRAINT "FranchiseeDocument_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KiloPrice" ADD CONSTRAINT "KiloPrice_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOnboarding" ADD CONSTRAINT "StoreOnboarding_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "StoreOnboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppTutorialSeen" ADD CONSTRAINT "AppTutorialSeen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistSection" ADD CONSTRAINT "ChecklistSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ChecklistSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResponseItem" ADD CONSTRAINT "ChecklistResponseItem_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "ChecklistResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResponseItem" ADD CONSTRAINT "ChecklistResponseItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
