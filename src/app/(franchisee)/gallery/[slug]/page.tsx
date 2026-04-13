import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MaterialCard } from "@/components/franchisee/MaterialCard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

async function getCategoryWithMaterials(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: {
      materials: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export default async function CategoryGalleryPage({ params }: PageProps) {
  const category = await getCategoryWithMaterials(params.slug);

  if (!category) notFound();

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        href="/gallery"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar às categorias
      </Link>

      {/* Header */}
      <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
        <span className="text-4xl sm:text-5xl">{category.icon}</span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="text-gray-500 mt-0.5 sm:mt-1 text-sm sm:text-base">{category.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-0.5 sm:mt-1">
            {category.materials.length} material(is) disponível(is)
          </p>
        </div>
      </div>

      {/* Materials Grid */}
      {category.materials.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-4xl">📭</span>
          <p className="text-gray-500 mt-4 font-medium">
            Nenhum material publicado nesta categoria ainda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {category.materials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      )}
    </div>
  );
}
