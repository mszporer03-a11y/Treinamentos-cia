-- AlterEnum: add NOTICE to FileType (idempotent, Postgres 12+)
ALTER TYPE "FileType" ADD VALUE IF NOT EXISTS 'NOTICE';

-- AlterTable: make Material.fileUrl / fileKey nullable (text-only "avisos")
ALTER TABLE "Material" ALTER COLUMN "fileUrl" DROP NOT NULL;
ALTER TABLE "Material" ALTER COLUMN "fileKey" DROP NOT NULL;
