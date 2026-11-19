import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PostFeed } from "@/components/PostFeed";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export default async function CategoryGalleryPage({ params }: PageProps) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const userStores = session?.user
    ? await db.userStore.findMany({ where: { userId: session.user.id }, select: { storeId: true } })
    : [];
  const storeIds = userStores.map((u) => u.storeId);

  const category = await db.category.findUnique({
    where: { slug: params.slug },
    include: {
      materials: {
        where: {
          ...(isAdmin
            ? {}
            : {
                published: true,
                OR: [
                  { linkedStores: { none: {} } },
                  { linkedStores: { some: { storeId: { in: storeIds } } } },
                ],
              }),
        },
        include: {
          category: { select: { id: true, name: true, icon: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!category) notFound();

  return (
    <div className="p-4 sm:p-6">
      <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition mb-6">
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
        <span className="text-4xl sm:text-5xl">{category.icon}</span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="text-gray-500 mt-0.5 sm:mt-1 text-sm sm:text-base">{category.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-0.5 sm:mt-1">{category.materials.length} post(s) disponível(is)</p>
        </div>
      </div>

      {category.materials.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-4xl">📭</span>
          <p className="text-gray-500 mt-4 font-medium">Nenhum post publicado nesta categoria ainda.</p>
        </div>
      ) : (
        <PostFeed materials={category.materials} trackViews />
      )}
    </div>
  );
}
