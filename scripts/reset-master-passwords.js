/**
 * Redefine as senhas das contas MASTER com senhas temporárias aleatórias.
 *
 * Contas: Rafael, Denis, Nilton, Marcos e André (mesma lista do seed e do
 * scripts/reset-data.js). As senhas novas são impressas UMA vez no terminal —
 * repasse-as por canal seguro e peça a cada pessoa para trocá-la em "Meu Perfil".
 *
 * Uso (aponte DATABASE_URL para o banco desejado):
 *   node scripts/reset-master-passwords.js            -> só lista as contas (dry-run)
 *   node scripts/reset-master-passwords.js --confirm  -> gera e grava as novas senhas
 *
 * Se alguma conta não existir, rode antes `npm run db:seed`.
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const MASTERS = [
  { name: "Rafael", email: "rmktcia@gmail.com" },
  { name: "Denis", email: "denis10081976@gmail.com" },
  { name: "Nilton", email: "nilton@companhiadochurrasco.com" },
  { name: "Marcos", email: "szporerm@gmail.com" },
  { name: "André", email: "aksaks@uol.com.br" },
];

// 12 caracteres sem ambiguidades visuais (sem 0/O, 1/l/I) + garante letra e número
function tempPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(12);
  let pwd = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  if (!/[0-9]/.test(pwd)) pwd = pwd.slice(0, 11) + "7";
  if (!/[a-z]/.test(pwd)) pwd = "k" + pwd.slice(1);
  if (!/[A-Z]/.test(pwd)) pwd = "K" + pwd.slice(1);
  return pwd;
}

async function main() {
  const db = new PrismaClient();
  const confirm = process.argv.includes("--confirm");

  const found = await db.user.findMany({
    where: { email: { in: MASTERS.map((m) => m.email) } },
    select: { id: true, email: true, role: true, active: true },
  });
  const byEmail = new Map(found.map((u) => [u.email, u]));

  console.log("Contas master:");
  for (const m of MASTERS) {
    const u = byEmail.get(m.email);
    console.log(` - ${m.name.padEnd(7)} ${m.email.padEnd(34)} ${u ? `${u.role}${u.active ? "" : " (inativo)"}` : "NÃO ENCONTRADA"}`);
  }

  if (!confirm) {
    console.log("\nDry-run: nenhuma senha foi alterada. Use --confirm para redefinir.");
    await db.$disconnect();
    return;
  }

  console.log("\nSenhas temporárias (anote agora — não ficam salvas em lugar nenhum):\n");
  for (const m of MASTERS) {
    const u = byEmail.get(m.email);
    if (!u) {
      console.log(` ${m.name.padEnd(7)} ${m.email} -> conta inexistente, pulada`);
      continue;
    }
    const pwd = tempPassword();
    await db.user.update({
      where: { id: u.id },
      data: { password: await bcrypt.hash(pwd, 12), role: "ADMIN", active: true },
    });
    console.log(` ${m.name.padEnd(7)} ${m.email.padEnd(34)} ${pwd}`);
  }
  console.log("\nConcluído.");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
