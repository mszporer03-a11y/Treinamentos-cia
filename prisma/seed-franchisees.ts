/**
 * seed-franchisees.ts
 * Importa todas as lojas e franqueados da planilha "Lista das Lojas e Franqueados ATUALIZADA 2026 VA".
 * Gera senhas aleatórias de 6 dígitos e persiste as credenciais em
 * prisma/franchisee-credentials.json para geração posterior do Word.
 *
 * Uso: npx tsx prisma/seed-franchisees.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

function generatePassword(): string {
  return (Math.floor(Math.random() * 900000) + 100000).toString();
}

// ──────────────────────────────────────────────
// LOJAS
// ──────────────────────────────────────────────
const STORES = [
  { code: "LOJA001", name: "Shop. Maceió",                     city: "Maceió - AL" },
  { code: "LOJA002", name: "Parque Shopping Maceió",           city: "Maceió - AL" },
  { code: "LOJA003", name: "Shop. Barra",                      city: "Salvador - BA" },
  { code: "LOJA004", name: "Shop. Salvador",                   city: "Salvador - BA" },
  { code: "LOJA005", name: "Shop. Da Bahia",                   city: "Salvador - BA" },
  { code: "LOJA006", name: "Shop. Bela Vista",                 city: "Salvador - BA" },
  { code: "LOJA007", name: "Shop. Paralela",                   city: "Salvador - BA" },
  { code: "LOJA008", name: "Shop. Parque Bahia",               city: "Lauro de Freitas - BA" },
  { code: "LOJA009", name: "Shop. Rio Mar Papicu",             city: "Fortaleza - CE" },
  { code: "LOJA010", name: "Shop. Iguatemi",                   city: "Fortaleza - CE" },
  { code: "LOJA011", name: "Norte Shopping",                   city: "Fortaleza - CE" },
  { code: "LOJA012", name: "Shop. Rio Mar Kennedy",            city: "Fortaleza - CE" },
  { code: "LOJA013", name: "Shop. Del Paseo",                  city: "Fortaleza - CE" },
  { code: "LOJA014", name: "Shop. Sobral",                     city: "Sobral - CE" },
  { code: "LOJA015", name: "Shopping Cariri",                  city: "Juazeiro do Norte - CE" },
  { code: "LOJA016", name: "Shopping Terrazo Eusébio",         city: "Fortaleza - CE" },
  { code: "LOJA017", name: "Shop. Brasília",                   city: "Brasília - DF" },
  { code: "LOJA018", name: "Shop. Park Brasília",              city: "Brasília - DF" },
  { code: "LOJA019", name: "Conjunto Nacional",                city: "Brasília - DF" },
  { code: "LOJA020", name: "Shop. Ilha",                       city: "São Luís - MA" },
  { code: "LOJA021", name: "Shop. São Luís",                   city: "São Luís - MA" },
  { code: "LOJA022", name: "Shopping GOLDEN",                  city: "São Luís - MA" },
  { code: "LOJA023", name: "Shopping RIO ANIL",                city: "São Luís - MA" },
  { code: "LOJA024", name: "Shop. Bosque Grão Pará",           city: "Belém - PA" },
  { code: "LOJA025", name: "Shopping Boulevard Belém",         city: "Belém - PA" },
  { code: "LOJA026", name: "Shop. Norte Caruaru",              city: "Caruaru - PE" },
  { code: "LOJA027", name: "Shop. Boa Vista",                  city: "Recife - PE" },
  { code: "LOJA028", name: "Shop. Rio Mar Recife",             city: "Recife - PE" },
  { code: "LOJA029", name: "Shopping Recife",                  city: "Recife - PE" },
  { code: "LOJA030", name: "River Shopping Petrolina",         city: "Petrolina - PE" },
  { code: "LOJA031", name: "Shop. Rio Poty",                   city: "Teresina - PI" },
  { code: "LOJA032", name: "Teresina Shopping",                city: "Teresina - PI" },
  { code: "LOJA033", name: "Shopping Porto Velho",             city: "Porto Velho - RO" },
  { code: "LOJA034", name: "Shop. Center Norte",               city: "São Paulo - SP" },
  { code: "LOJA035", name: "Partage Shopping Mossoró",         city: "Mossoró - RN" },
  { code: "LOJA036", name: "Partage Shopping Mossoró 2",       city: "Mossoró - RN" },
  { code: "LOJA037", name: "Shopping Plaza Casa Forte",        city: "Recife - PE" },
  { code: "LOJA038", name: "Shopping Parangaba",               city: "Fortaleza - CE" },
] as const;

// ──────────────────────────────────────────────
// FRANQUEADOS  (agrupados por e-mail)
// ──────────────────────────────────────────────
const FRANCHISEES = [
  {
    name: "Marcos Sá",
    email: "azevedosa21@yahoo.com.br",
    stores: ["LOJA001","LOJA002","LOJA009","LOJA012","LOJA016","LOJA024","LOJA025","LOJA035","LOJA036"],
  },
  {
    name: "Fernando Daltro",
    email: "fernandodaltro@hotmail.com",
    stores: ["LOJA003","LOJA004","LOJA008"],
  },
  {
    name: "Roberta",
    email: "aksaks@uol.com.br",
    stores: ["LOJA005","LOJA006","LOJA007","LOJA028","LOJA029"],
  },
  {
    name: "Fabio Pinho Kolling",
    email: "fabiopinhokolling@gmail.com",
    stores: ["LOJA010","LOJA011","LOJA013"],
  },
  {
    name: "Aila Osteno",
    email: "ailamosternodionizio@gmail.com",
    stores: ["LOJA014"],
  },
  {
    name: "Carlos Camerino",
    email: "camerinocarlos@gmail.com",
    stores: ["LOJA015","LOJA038"],
  },
  {
    name: "Tarcyla / Linus",
    email: "ciachurrascobsb@gmail.com",
    stores: ["LOJA017"],
  },
  {
    name: "Marco Aurélio",
    email: "ciachurrascopark@gmail.com",
    stores: ["LOJA018","LOJA019"],
  },
  {
    name: "Fabio Nogueira",
    email: "fabiocmartins@gmail.com",
    stores: ["LOJA020","LOJA021","LOJA022","LOJA023"],
  },
  {
    name: "Nice",
    email: "nicegcosta@outlook.com",
    stores: ["LOJA026"],
  },
  {
    name: "Gustavo Mesquita",
    email: "gustavodecarvalhomesquita@gmail.com",
    stores: ["LOJA027"],
  },
  {
    name: "Tiago",
    email: "companhiadochurrascoriver@gmail.com",
    stores: ["LOJA030"],
  },
  {
    name: "Roseleide / Raul",
    email: "ledamelooliveira@gmail.com",
    stores: ["LOJA031","LOJA032"],
  },
  {
    name: "Flavio Otake",
    email: "fotake@hotmail.com",
    stores: ["LOJA033"],
  },
  {
    name: "Cristina",
    email: "restnorte@gmail.com",
    stores: ["LOJA034"],
  },
  {
    name: "Lauro",
    email: "ciadochurrascoplaza@gmail.com",
    stores: ["LOJA037"],
  },
];

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
  console.log("🌱 Importando lojas e franqueados...\n");

  // 1. Criar lojas
  const storeIdByCode: Record<string, string> = {};
  for (const s of STORES) {
    const created = await db.store.upsert({
      where: { code: s.code },
      update: { name: s.name, city: s.city },
      create: { code: s.code, name: s.name, city: s.city, active: true },
    });
    storeIdByCode[s.code] = created.id;
    console.log(`  🏪 ${s.code} – ${s.name}`);
  }

  console.log(`\n✅ ${STORES.length} lojas processadas.\n`);

  // 2. Criar franqueados e associar lojas
  const credentials: Array<{
    name: string;
    email: string;
    password: string;
    stores: string[];
  }> = [];

  for (const f of FRANCHISEES) {
    // Verificar se o usuário já existe para não sobrescrever senha
    const existing = await db.user.findUnique({ where: { email: f.email } });
    const pwd = existing ? null : generatePassword();

    let user: { id: string; name: string; email: string };

    if (existing) {
      // Já existe: só garante que seja FRANCHISEE ativo
      user = await db.user.update({
        where: { email: f.email },
        data: { active: true },
        select: { id: true, name: true, email: true },
      });
      console.log(`  ♻️  Já existe: ${f.email} (senha mantida)`);
    } else {
      const hashed = await bcrypt.hash(pwd!, 12);
      user = await db.user.create({
        data: {
          name: f.name,
          email: f.email,
          password: hashed,
          role: "FRANCHISEE",
          active: true,
        },
        select: { id: true, name: true, email: true },
      });
      console.log(`  👤 Criado: ${f.email} / ${pwd}`);
    }

    // Associar lojas
    for (const code of f.stores) {
      const storeId = storeIdByCode[code];
      if (!storeId) { console.warn(`    ⚠️  Código de loja não encontrado: ${code}`); continue; }
      await db.userStore.upsert({
        where: { userId_storeId: { userId: user.id, storeId } },
        update: {},
        create: { userId: user.id, storeId },
      });
    }

    credentials.push({
      name: f.name,
      email: f.email,
      password: pwd ?? "(existente – senha não alterada)",
      stores: f.stores.map((c) => {
        const s = STORES.find((x) => x.code === c);
        return s ? `${s.name} (${s.city})` : c;
      }),
    });
  }

  // 3. Persistir credenciais em JSON
  const outputPath = path.join(__dirname, "franchisee-credentials.json");
  fs.writeFileSync(outputPath, JSON.stringify(credentials, null, 2), "utf-8");

  console.log(`\n✅ ${FRANCHISEES.length} franqueados processados.`);
  console.log(`📄 Credenciais salvas em: ${outputPath}`);
  console.log("\n⚠️  Guarde este arquivo com segurança – contém senhas em texto puro.\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
