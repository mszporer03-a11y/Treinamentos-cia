/**
 * Reinício do zero da plataforma — DESTRUTIVO e manual.
 *
 * Apaga: conversas/solicitações, comunicados, materiais (postagens), registros,
 * pesquisas, onboardings e TODOS os usuários, exceto os administradores abaixo.
 * Mantém: lojas, categorias e os administradores.
 *
 * Uso (aponte DATABASE_URL para o banco desejado):
 *   node scripts/reset-data.js            -> só mostra o que seria apagado (dry-run)
 *   node scripts/reset-data.js --confirm  -> apaga de verdade
 *
 * Depois rode `npm run db:seed` para garantir que os administradores existam.
 */
const { PrismaClient } = require("@prisma/client");

const KEEP_EMAILS = [
  "rmktcia@gmail.com",
  "denis10081976@gmail.com",
  "nilton@companhiadochurrasco.com",
  "szporerm@gmail.com",
  "aksaks@uol.com.br",
];

async function main() {
  const db = new PrismaClient();
  const confirm = process.argv.includes("--confirm");

  const counts = {
    mensagens: await db.message.count(),
    conversas: await db.conversation.count(),
    comunicados: await db.comunicado.count(),
    materiais: await db.material.count(),
    registros: await db.nonComplianceAlert.count(),
    pesquisas: await db.survey.count(),
    onboardings: await db.storeOnboarding.count(),
    usuariosARemover: await db.user.count({ where: { email: { notIn: KEEP_EMAILS } } }),
  };
  console.log("Registros que serão apagados:", counts);

  if (!confirm) {
    console.log("\nDry-run: nada foi apagado. Use --confirm para executar.");
    await db.$disconnect();
    return;
  }

  await db.$transaction([
    db.message.deleteMany(),
    db.conversation.deleteMany(),
    db.comunicado.deleteMany(),
    db.material.deleteMany(),
    db.nonComplianceAlert.deleteMany(),
    db.survey.deleteMany(),
    db.storeOnboarding.deleteMany(),
    db.user.deleteMany({ where: { email: { notIn: KEEP_EMAILS } } }),
  ]);
  console.log("\nConcluído. Rode `npm run db:seed` para garantir os administradores.");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
