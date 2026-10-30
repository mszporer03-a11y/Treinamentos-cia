/**
 * Antes do `prisma migrate deploy`: se alguma das migrações abaixo ficou
 * registrada como FALHA no banco (P3009), marca como "rolled back" para que
 * o deploy a execute novamente. Só atua nesta lista — são migrações
 * idempotentes, seguras para reexecutar.
 *
 * Uso: node scripts/resolve-failed-migrations.js
 */
const { execFileSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

const RETRYABLE = [
  "20261030000000_multi_attachments",
  "20261030010000_user_login_phone_emergency_chat",
];

async function main() {
  const db = new PrismaClient();
  let failed = [];
  try {
    failed = await db.$queryRawUnsafe(
      `SELECT migration_name FROM "_prisma_migrations"
       WHERE finished_at IS NULL AND rolled_back_at IS NULL AND migration_name = ANY($1)`,
      RETRYABLE
    );
  } catch {
    // Banco novo (sem _prisma_migrations): nada a resolver
  } finally {
    await db.$disconnect();
  }

  for (const { migration_name } of failed) {
    console.log(`↺ Migração com falha anterior, marcando para reexecução: ${migration_name}`);
    execFileSync("npx", ["prisma", "migrate", "resolve", "--rolled-back", migration_name], { stdio: "inherit" });
  }
}

main().catch((e) => {
  console.error("[resolve-failed-migrations]", e);
  process.exit(1);
});
