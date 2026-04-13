import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getCategories() {
  return db.category.findMany({
    include: {
      _count: {
        select: { materials: { where: { published: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
}

export default async function GalleryPage() {
  const categories = await getCategories();

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Materiais de Treinamento
        </h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
          Navegue pelas categorias e acesse todos os materiais disponíveis
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-24">
          <span className="text-5xl">📚</span>
          <p className="text-gray-500 mt-4 text-lg font-medium">
            Nenhum material disponível ainda
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Novos materiais serão adicionados em breve.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/gallery/${category.slug}`}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-4 sm:p-6 flex flex-col border border-transparent hover:border-blue-100"
            >
              <div className="text-3xl sm:text-5xl mb-3 sm:mb-4">{category.icon}</div>
              <h2 className="text-base sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition leading-snug">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 line-clamp-2 flex-1">
                  {category.description}
                </p>
              )}
              <div className="mt-3 sm:mt-4 flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-400">
                  {category._count.materials} material(is)
                </span>
                <span className="text-xs sm:text-sm text-blue-600 font-medium group-hover:translate-x-1 transition-transform inline-block">
                  Ver →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
