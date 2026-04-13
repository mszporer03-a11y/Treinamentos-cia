import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Usuário Admin padrão
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@treinamentos.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@treinamentos.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin criado: ${admin.email} / senha: admin123`);

  // Usuário Master - Marcos
  const hashedPasswordMarcos = await bcrypt.hash("Marcos010203!", 12);
  const marcos = await db.user.upsert({
    where: { email: "szporerm@gmail.com" },
    update: {},
    create: {
      name: "Marcos",
      email: "szporerm@gmail.com",
      password: hashedPasswordMarcos,
      role: "ADMIN",
    },
  });
  console.log(`✅ Master criado: ${marcos.email}`);

  // Categorias de exemplo
  const categories = [
    {
      name: "Vendas",
      slug: "vendas",
      description: "Técnicas de vendas e argumentação",
      icon: "💰",
    },
    {
      name: "Marketing",
      slug: "marketing",
      description: "Materiais de marketing e comunicação",
      icon: "📢",
    },
    {
      name: "Operações",
      slug: "operacoes",
      description: "Manuais e procedimentos operacionais",
      icon: "⚙️",
    },
    {
      name: "Atendimento ao Cliente",
      slug: "atendimento",
      description: "Treinamento de atendimento e relacionamento",
      icon: "🤝",
    },
    {
      name: "Financeiro",
      slug: "financeiro",
      description: "Gestão financeira e controles",
      icon: "📊",
    },
  ];

  for (const cat of categories) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    console.log(`✅ Categoria: ${cat.name}`);
  }

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("📧 Admin: admin@treinamentos.com");
  console.log("🔑 Senha: admin123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
