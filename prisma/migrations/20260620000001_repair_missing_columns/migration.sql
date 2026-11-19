-- Reparo de schema: tabelas criadas com CREATE TABLE IF NOT EXISTS em bancos que já tinham
-- versões antigas delas ficaram sem colunas novas (ex.: NonComplianceAlert.status).
-- Adiciona, de forma idempotente, toda coluna que estiver faltando.

DO $$ BEGIN
  IF to_regclass('"MaterialStore"') IS NOT NULL THEN
    ALTER TABLE "MaterialStore" ADD COLUMN IF NOT EXISTS "materialId" TEXT;
    ALTER TABLE "MaterialStore" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"MessageStore"') IS NOT NULL THEN
    ALTER TABLE "MessageStore" ADD COLUMN IF NOT EXISTS "messageId" TEXT;
    ALTER TABLE "MessageStore" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"SupplyRequest"') IS NOT NULL THEN
    ALTER TABLE "SupplyRequest" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
    ALTER TABLE "SupplyRequest" ADD COLUMN IF NOT EXISTS "requesterId" TEXT;
    BEGIN
      ALTER TABLE "SupplyRequest" ADD COLUMN IF NOT EXISTS "status" "SupplyStatus" NOT NULL DEFAULT 'PENDING';
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    ALTER TABLE "SupplyRequest" ADD COLUMN IF NOT EXISTS "notes" TEXT;
    ALTER TABLE "SupplyRequest" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
    ALTER TABLE "SupplyRequest" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE "SupplyRequest" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"SupplyRequestItem"') IS NOT NULL THEN
    ALTER TABLE "SupplyRequestItem" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
    BEGIN
      ALTER TABLE "SupplyRequestItem" ADD COLUMN IF NOT EXISTS "category" "SupplyCategory";
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    ALTER TABLE "SupplyRequestItem" ADD COLUMN IF NOT EXISTS "name" TEXT;
    ALTER TABLE "SupplyRequestItem" ADD COLUMN IF NOT EXISTS "quantity" INTEGER;
    ALTER TABLE "SupplyRequestItem" ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'un';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"Employee"') IS NOT NULL THEN
    ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
    ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "name" TEXT;
    BEGIN
      ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "role" "EmployeeRole" NOT NULL DEFAULT 'OUTRO';
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "contact" TEXT;
    ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"WorkSchedule"') IS NOT NULL THEN
    ALTER TABLE "WorkSchedule" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
    ALTER TABLE "WorkSchedule" ADD COLUMN IF NOT EXISTS "weekStart" TIMESTAMP(3);
    ALTER TABLE "WorkSchedule" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE "WorkSchedule" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"WorkShift"') IS NOT NULL THEN
    ALTER TABLE "WorkShift" ADD COLUMN IF NOT EXISTS "scheduleId" TEXT;
    ALTER TABLE "WorkShift" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;
    ALTER TABLE "WorkShift" ADD COLUMN IF NOT EXISTS "dayIndex" INTEGER;
    BEGIN
      ALTER TABLE "WorkShift" ADD COLUMN IF NOT EXISTS "type" "ShiftType" NOT NULL DEFAULT 'MANHA';
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    ALTER TABLE "WorkShift" ADD COLUMN IF NOT EXISTS "startTime" TEXT;
    ALTER TABLE "WorkShift" ADD COLUMN IF NOT EXISTS "endTime" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"EmployeeTraining"') IS NOT NULL THEN
    ALTER TABLE "EmployeeTraining" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;
    ALTER TABLE "EmployeeTraining" ADD COLUMN IF NOT EXISTS "materialId" TEXT;
    ALTER TABLE "EmployeeTraining" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE "EmployeeTraining" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"NonComplianceAlert"') IS NOT NULL THEN
    ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
    ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "title" TEXT;
    ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "description" TEXT;
    BEGIN
      ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM';
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "status" "AlertStatus" NOT NULL DEFAULT 'OPEN';
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
    ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "resolution" TEXT;
    ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE "NonComplianceAlert" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"MarketingCampaign"') IS NOT NULL THEN
    ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "title" TEXT;
    ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "description" TEXT;
    ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
    ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);
    ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "published" BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"CampaignAsset"') IS NOT NULL THEN
    ALTER TABLE "CampaignAsset" ADD COLUMN IF NOT EXISTS "campaignId" TEXT;
    ALTER TABLE "CampaignAsset" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
    ALTER TABLE "CampaignAsset" ADD COLUMN IF NOT EXISTS "fileKey" TEXT;
    ALTER TABLE "CampaignAsset" ADD COLUMN IF NOT EXISTS "fileName" TEXT;
    ALTER TABLE "CampaignAsset" ADD COLUMN IF NOT EXISTS "fileType" TEXT;
    ALTER TABLE "CampaignAsset" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"Survey"') IS NOT NULL THEN
    ALTER TABLE "Survey" ADD COLUMN IF NOT EXISTS "question" TEXT;
    ALTER TABLE "Survey" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE "Survey" ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP(3);
    ALTER TABLE "Survey" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"SurveyOption"') IS NOT NULL THEN
    ALTER TABLE "SurveyOption" ADD COLUMN IF NOT EXISTS "surveyId" TEXT;
    ALTER TABLE "SurveyOption" ADD COLUMN IF NOT EXISTS "text" TEXT;
    ALTER TABLE "SurveyOption" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"SurveyResponse"') IS NOT NULL THEN
    ALTER TABLE "SurveyResponse" ADD COLUMN IF NOT EXISTS "surveyId" TEXT;
    ALTER TABLE "SurveyResponse" ADD COLUMN IF NOT EXISTS "optionId" TEXT;
    ALTER TABLE "SurveyResponse" ADD COLUMN IF NOT EXISTS "userId" TEXT;
    ALTER TABLE "SurveyResponse" ADD COLUMN IF NOT EXISTS "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"FranchiseeDocument"') IS NOT NULL THEN
    ALTER TABLE "FranchiseeDocument" ADD COLUMN IF NOT EXISTS "franchiseeId" TEXT;
    ALTER TABLE "FranchiseeDocument" ADD COLUMN IF NOT EXISTS "title" TEXT;
    BEGIN
      ALTER TABLE "FranchiseeDocument" ADD COLUMN IF NOT EXISTS "category" "DocCategory" NOT NULL DEFAULT 'OUTRO';
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    ALTER TABLE "FranchiseeDocument" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
    ALTER TABLE "FranchiseeDocument" ADD COLUMN IF NOT EXISTS "fileKey" TEXT;
    ALTER TABLE "FranchiseeDocument" ADD COLUMN IF NOT EXISTS "fileName" TEXT;
    ALTER TABLE "FranchiseeDocument" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
    ALTER TABLE "FranchiseeDocument" ADD COLUMN IF NOT EXISTS "notes" TEXT;
    ALTER TABLE "FranchiseeDocument" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"KiloPrice"') IS NOT NULL THEN
    ALTER TABLE "KiloPrice" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
    ALTER TABLE "KiloPrice" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION;
    ALTER TABLE "KiloPrice" ADD COLUMN IF NOT EXISTS "suggestedById" TEXT;
    ALTER TABLE "KiloPrice" ADD COLUMN IF NOT EXISTS "suggestedNote" TEXT;
    ALTER TABLE "KiloPrice" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);
    ALTER TABLE "KiloPrice" ADD COLUMN IF NOT EXISTS "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE "KiloPrice" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"StoreOnboarding"') IS NOT NULL THEN
    ALTER TABLE "StoreOnboarding" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
    ALTER TABLE "StoreOnboarding" ADD COLUMN IF NOT EXISTS "isNewStore" BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE "StoreOnboarding" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
    ALTER TABLE "StoreOnboarding" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE "StoreOnboarding" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"OnboardingStep"') IS NOT NULL THEN
    ALTER TABLE "OnboardingStep" ADD COLUMN IF NOT EXISTS "onboardingId" TEXT;
    ALTER TABLE "OnboardingStep" ADD COLUMN IF NOT EXISTS "title" TEXT;
    ALTER TABLE "OnboardingStep" ADD COLUMN IF NOT EXISTS "description" TEXT;
    BEGIN
      ALTER TABLE "OnboardingStep" ADD COLUMN IF NOT EXISTS "phase" "OnboardingPhase";
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    ALTER TABLE "OnboardingStep" ADD COLUMN IF NOT EXISTS "responsible" TEXT;
    ALTER TABLE "OnboardingStep" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE "OnboardingStep" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"AppTutorialSeen"') IS NOT NULL THEN
    ALTER TABLE "AppTutorialSeen" ADD COLUMN IF NOT EXISTS "userId" TEXT;
    ALTER TABLE "AppTutorialSeen" ADD COLUMN IF NOT EXISTS "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"ChecklistTemplate"') IS NOT NULL THEN
    ALTER TABLE "ChecklistTemplate" ADD COLUMN IF NOT EXISTS "name" TEXT;
    ALTER TABLE "ChecklistTemplate" ADD COLUMN IF NOT EXISTS "description" TEXT;
    ALTER TABLE "ChecklistTemplate" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE "ChecklistTemplate" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE "ChecklistTemplate" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"ChecklistSection"') IS NOT NULL THEN
    ALTER TABLE "ChecklistSection" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
    ALTER TABLE "ChecklistSection" ADD COLUMN IF NOT EXISTS "name" TEXT;
    ALTER TABLE "ChecklistSection" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"ChecklistItem"') IS NOT NULL THEN
    ALTER TABLE "ChecklistItem" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;
    ALTER TABLE "ChecklistItem" ADD COLUMN IF NOT EXISTS "text" TEXT;
    ALTER TABLE "ChecklistItem" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"ChecklistResponse"') IS NOT NULL THEN
    ALTER TABLE "ChecklistResponse" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
    ALTER TABLE "ChecklistResponse" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
    ALTER TABLE "ChecklistResponse" ADD COLUMN IF NOT EXISTS "responderId" TEXT;
    ALTER TABLE "ChecklistResponse" ADD COLUMN IF NOT EXISTS "notes" TEXT;
    ALTER TABLE "ChecklistResponse" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
    ALTER TABLE "ChecklistResponse" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"ChecklistResponseItem"') IS NOT NULL THEN
    ALTER TABLE "ChecklistResponseItem" ADD COLUMN IF NOT EXISTS "responseId" TEXT;
    ALTER TABLE "ChecklistResponseItem" ADD COLUMN IF NOT EXISTS "itemId" TEXT;
    ALTER TABLE "ChecklistResponseItem" ADD COLUMN IF NOT EXISTS "checked" BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE "ChecklistResponseItem" ADD COLUMN IF NOT EXISTS "notes" TEXT;
  END IF;
END $$;
