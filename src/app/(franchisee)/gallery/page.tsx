import { db } from "@/lib/db";
import Link from "next/link";
import { MaterialCard } from "@/components/franchisee/MaterialCard";

export const dynamic = "force-dynamic";

async function getData() {
  const [categories, recentMaterials] = await Promise.all([
    db.category.findMany({
      include: {
        _count: { select: { materials: { where: { published: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    db.material.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { category: true },
    }),
  ]);
  return { categories, recentMaterials };
}

export default async function GalleryPage() {
  const { categories, recentMaterials } = await getData();

  return (
    <div>
      {/* Feed de materiais recentes */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Treinamentos
        </h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
          Últimos materiais publicados
        </p>
      </div>

      {recentMaterials.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">📚</span>
          <p className="text-gray-500 mt-4 text-lg font-medium">
            Nenhum material disponível ainda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 mb-10 sm:mb-14">
          {recentMaterials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      )}

      {/* Categorias */}
      {categories.length > 0 && (
        <>
          <div className="mb-4 sm:mb-6 border-t border-gray-100 pt-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Categorias</h2>
            <p className="text-gray-500 text-sm mt-1">Filtre por categoria</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/gallery/${category.slug}`}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-4 sm:p-5 flex items-center gap-3 border border-transparent hover:border-blue-100"
              >
                <span className="text-2xl sm:text-3xl flex-shrink-0">{category.icon}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {category._count.materials} material(is)
                  </p>
                </div>
                <span className="text-blue-400 group-hover:translate-x-1 transition-transform text-sm">→</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
