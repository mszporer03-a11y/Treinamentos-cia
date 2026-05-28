"use client";

import { useEffect, useState } from "react";
import { FileText, Download } from "lucide-react";
import { useSession } from "next-auth/react";

type Doc = {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileName: string;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
};

const CAT_LABEL: Record<string, string> = {
  CONTRATO: "Contrato", ADITIVO: "Aditivo", PROCURACAO: "Procuração",
  ALVARA: "Alvará", CERTIFICADO: "Certificado", OUTRO: "Outro",
};
const CAT_COLOR: Record<string, string> = {
  CONTRATO: "bg-blue-100 text-blue-700", ADITIVO: "bg-purple-100 text-purple-700",
  PROCURACAO: "bg-orange-100 text-orange-700", ALVARA: "bg-green-100 text-green-700",
  CERTIFICADO: "bg-teal-100 text-teal-700", OUTRO: "bg-gray-100 text-gray-600",
};

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents").then((r) => r.json()).then((d) => { setDocs(d); setLoading(false); });
  }, []);

  if (!session?.user) return null;

  const expiringSoon = docs.filter((d) => {
    if (!d.expiresAt) return false;
    const days = (new Date(d.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-7 w-7 text-blue-500" /> Meus Documentos
        </h1>
        <p className="text-gray-500 text-sm mt-1">Contratos, alvarás e documentos da sua franquia.</p>
      </div>

      {expiringSoon.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          ⚠️ {expiringSoon.length} documento(s) vencem nos próximos 30 dias. Renove com antecedência.
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum documento disponível ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => {
            const isExpiring = d.expiresAt && (new Date(d.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 30 && (new Date(d.expiresAt).getTime() - Date.now()) >= 0;
            const isExpired = d.expiresAt && new Date(d.expiresAt) < new Date();
            return (
              <div key={d.id} className={`bg-white border rounded-xl p-4 flex items-center gap-4 ${isExpired ? "border-red-100" : "border-gray-100"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{d.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLOR[d.category]}`}>{CAT_LABEL[d.category]}</span>
                    {isExpired && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">Vencido</span>}
                    {isExpiring && !isExpired && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Vence em breve</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Adicionado em {new Date(d.createdAt).toLocaleDateString("pt-BR")}
                    {d.expiresAt && ` · Validade: ${new Date(d.expiresAt).toLocaleDateString("pt-BR")}`}
                  </p>
                  {d.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{d.notes}</p>}
                </div>
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition">
                  <Download className="h-3.5 w-3.5" /> Baixar
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
