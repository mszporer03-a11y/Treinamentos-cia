import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Administradores da plataforma. Apenas o hash bcrypt das senhas iniciais fica
// no repositorio; a senha so e gravada na primeira criacao (nunca sobrescrita).
const ADMINS = [
  { name: "Rafael", email: "rmktcia@gmail.com", hash: "$2a$12$hqnWz/ZWxvBCCkwmoGGL7OEb6KdIgKezP9cK0dHlfUplFl9Jcj3ae" },
  { name: "Denis", email: "denis10081976@gmail.com", hash: "$2a$12$GF7THqeLKUyFJyY9M0xI/u5wQ3LlxaYfjMcguv90DVMuz9JiAmRyy" },
  { name: "Nilton", email: "nilton@companhiadochurrasco.com", hash: "$2a$12$XIPIYe9GzzQUr0Y7z62jZeBUGYPnYb8rIaYfqkUtzoYlEkveiq7OW" },
  { name: "Marcos", email: "szporerm@gmail.com", hash: "$2a$12$XxfUtvtRRprrQ2zhCgtw/.LQ6sK6NwqKvO89XdDmYZzPoav4Dutui" },
  { name: "André Szporer", email: "aksaks@uol.com.br", hash: "$2a$12$XUzSRtud.FMOBtQDTFxFs.CMy7DopU1bcCYNae4xY9lM1tYTC6jsO" },
];

async function main() {
  console.log("Iniciando seed do banco de dados...");

  for (const a of ADMINS) {
    await db.user.upsert({
      where: { email: a.email },
      update: { role: "ADMIN", active: true },
      create: { name: a.name, email: a.email, password: a.hash, role: "ADMIN" },
    });
    console.log(`Admin: ${a.email}`);
  }

  const categories = [
    { name: "Vendas", slug: "vendas", description: "Técnicas de vendas e argumentação", icon: "💰" },
    { name: "Mídia", slug: "midia", description: "Materiais de mídia e comunicação", icon: "📣" },
    { name: "Operações", slug: "operacoes", description: "Manuais e procedimentos operacionais", icon: "⚙️" },
    { name: "Atendimento ao Cliente", slug: "atendimento", description: "Treinamento de atendimento e relacionamento", icon: "🤝" },
    { name: "Financeiro", slug: "financeiro", description: "Gestão financeira e controles", icon: "📊" },
    { name: "Avisos", slug: "avisos", description: "Comunicados e avisos em texto para a rede", icon: "📢" },
  ];

  for (const cat of categories) {
    await db.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }

  console.log("Seed concluido com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
