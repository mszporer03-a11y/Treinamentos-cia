"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { MaterialFeedMedia } from "@/components/attachments/MaterialFeedMedia";

interface Material {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string | null;
  fileType: string;
  fileSize?: number | null;
  mimeType?: string | null;
  attachments?: unknown;
  published: boolean;
  createdAt: Date | string;
  category: { id: string; name: string; icon: string | null };
  createdBy?: { name: string } | null;
}

function FeedCard({
  material,
  onOpen,
  onDelete,
}: {
  material: Material;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">
            {(material.createdBy?.name ?? "A").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {material.createdBy?.name ?? "Admin"}
          </p>
          <p className="text-xs text-gray-400">
            {material.category.icon} {material.category.name} · {formatDate(material.createdAt)}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
            material.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {material.published ? "Publicado" : "Rascunho"}
        </span>
      </div>

      {/* Preview — mosaico quando há vários anexos */}
      <div className="px-3">
        <MaterialFeedMedia material={material} onOpen={onOpen} />
      </div>

      <button onClick={onOpen} className="w-full text-left focus:outline-none group">
        <div className="px-4 pt-2.5 pb-1">
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {material.title}
          </p>
          {material.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{material.description}</p>
          )}
        </div>
      </button>

      <div className="flex items-center justify-between px-4 pb-3">
        <button onClick={onOpen} className="text-xs text-blue-600 font-medium hover:underline">
          Clique para abrir →
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Apagar postagem (qualquer administrador pode moderar)"
        >
          <Trash2 className="h-3.5 w-3.5" /> Apagar
        </button>
      </div>
    </div>
  );
}

export function AdminFeed({ materials: initial }: { materials: Material[] }) {
  const router = useRouter();
  const [materials, setMaterials] = useState(initial);
  const [viewing, setViewing] = useState<Material | null>(null);

  // Moderação colaborativa: qualquer admin pode apagar qualquer postagem
  async function handleDelete(mat: Material) {
    if (!confirm(`Apagar a postagem "${mat.title}"${mat.createdBy?.name ? ` (postado por ${mat.createdBy.name})` : ""}?`)) return;
    const res = await fetch(`/api/materials/${mat.id}`, { method: "DELETE" });
    if (res.ok) {
      setMaterials((prev) => prev.filter((m) => m.id !== mat.id));
      router.refresh();
    } else {
      alert("Erro ao apagar a postagem");
    }
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl">
        <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Nenhum material cadastrado ainda</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {materials.map((mat) => (
          <FeedCard key={mat.id} material={mat} onOpen={() => setViewing(mat)} onDelete={() => handleDelete(mat)} />
        ))}
      </div>

      {viewing && (
        <MaterialViewer material={viewing} onClose={() => setViewing(null)} />
      )}
    </>
  );
}
