import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PostGrid } from "@/components/posts/PostGrid";
import { materialVisibilityWhere } from "@/lib/access";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export default async function CategoryGalleryPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const category = await db.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const visibility = await materialVisibilityWhere(session.user);
  const materials = await db.material.findMany({
    where: { categoryId: category.id, ...visibility },
    include: { category: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6">
      <Link href="/gallery?aba=categorias" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition mb-6">
        <ChevronLeft className="h-4 w-4" />
        Voltar às categorias
      </Link>

      <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
        <span className="text-4xl sm:text-5xl">{category.icon}</span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{category.name}</h1>
          {category.description && <p className="text-gray-500 mt-0.5 text-sm sm:text-base">{category.description}</p>}
          <p className="text-sm text-gray-400 mt-0.5">
            {materials.length} publicaç{materials.length === 1 ? "ão" : "ões"}
          </p>
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-4xl">📭</span>
          <p className="text-gray-500 mt-4 font-medium">Nenhuma publicação nesta categoria ainda.</p>
        </div>
      ) : (
        <PostGrid materials={JSON.parse(JSON.stringify(materials))} trackViews />
      )}
    </div>
  );
}
