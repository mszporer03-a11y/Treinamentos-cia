import { db } from "@/lib/db";
import { Users, FolderOpen, FileText, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [totalUsers, totalCategories, totalMaterials, publishedMaterials, recentMaterials] =
    await Promise.all([
      db.user.count(),
      db.category.count(),
      db.material.count(),
      db.material.count({ where: { published: true } }),
      db.material.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { category: true },
      }),
    ]);

  return {
    totalUsers,
    totalCategories,
    totalMaterials,
    publishedMaterials,
    recentMaterials,
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const stats = [
    {
      label: "Usuários",
      value: data.totalUsers,
      icon: Users,
      color: "bg-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Categorias",
      value: data.totalCategories,
      icon: FolderOpen,
      color: "bg-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Total de Materiais",
      value: data.totalMaterials,
      icon: FileText,
      color: "bg-purple-500",
      bg: "bg-purple-50",
    },
    {
      label: "Publicados",
      value: data.publishedMaterials,
      icon: Eye,
      color: "bg-orange-500",
      bg: "bg-orange-50",
    },
  ];

  const fileTypeIcon: Record<string, string> = {
    VIDEO: "🎬",
    PDF: "📄",
    IMAGE: "🖼️",
    DOCUMENT: "📝",
    OTHER: "📁",
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Visão geral do portal de treinamentos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 md:mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4"
          >
            <div className={`${stat.color} p-3 rounded-xl`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Materials */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Materiais Recentes
        </h2>
        {data.recentMaterials.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              Nenhum material cadastrado ainda
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recentMaterials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl flex-shrink-0">
                    {fileTypeIcon[material.fileType]}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {material.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {material.category.icon} {material.category.name} •{" "}
                      {formatDate(material.createdAt)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ml-3 ${
                    material.published
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {material.published ? "Publicado" : "Rascunho"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
