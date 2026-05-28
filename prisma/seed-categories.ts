import { db } from "../src/lib/db";

const categories = [
  {
    name: "Editais da Franquia",
    slug: "editais-da-franquia",
    description: "Editais oficiais e comunicados normativos da rede",
    icon: "📋",
  },
  {
    name: "Cardápio do Mês",
    slug: "cardapio-do-mes",
    description: "Cardápios, promoções e novidades mensais",
    icon: "🍖",
  },
  {
    name: "Treinamentos",
    slug: "treinamentos",
    description: "Vídeos, manuais e materiais de capacitação",
    icon: "🎓",
  },
  {
    name: "Cia News",
    slug: "cia-news",
    description: "Novidades, avisos e comunicados internos da Cia do Churrasco",
    icon: "📰",
  },
];

async function main() {
  for (const cat of categories) {
    const existing = await db.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      console.log(`⏭  Já existe: ${cat.name}`);
      continue;
    }
    await db.category.create({ data: cat });
    console.log(`✅ Criada: ${cat.name}`);
  }
  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
