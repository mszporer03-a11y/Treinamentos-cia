"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  MessageSquare,
  Megaphone,
  HelpCircle,
  KeyRound,
  MonitorCog,
  Paperclip,
  X,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-components";

type Store = { id: string; name: string; code: string };

const CATEGORIES: Record<string, { label: string; Icon: React.ElementType; color: string; description: string }> = {
  solicitacoes: {
    label: "Solicitações",
    Icon: MessageSquare,
    color: "from-blue-500 to-indigo-500",
    description: "Use este canal para solicitar qualquer tipo de suporte ou serviço da Companhia do Churrasco. Descreva sua necessidade com detalhes e anexe imagens ou documentos se necessário. Nossa equipe responderá em breve.",
  },
  marketing: {
    label: "Marketing",
    Icon: Megaphone,
    color: "from-purple-500 to-violet-500",
    description: "Solicite peças, artes, campanhas, posts para redes sociais, banners, flyers e outros materiais de divulgação para a sua loja. Informe o prazo desejado e todos os detalhes da solicitação.",
  },
  "senhas-usuarios": {
    label: "Senhas e usuários",
    Icon: KeyRound,
    color: "from-amber-500 to-orange-500",
    description: "Solicite criação, alteração ou redefinição de senhas e permissões de acesso ao sistema para você ou sua equipe. Informe o nome do colaborador e o tipo de acesso necessário.",
  },
  "suporte-sistema": {
    label: "Suporte Sistema",
    Icon: MonitorCog,
    color: "from-cyan-500 to-teal-500",
    description: "Relate problemas técnicos, erros no sistema, lentidão ou dificuldades com equipamentos e softwares utilizados na operação da sua loja. Descreva o problema com o máximo de detalhes.",
  },
  outros: {
    label: "Outros",
    Icon: HelpCircle,
    color: "from-gray-500 to-gray-600",
    description: "Para assuntos que não se encaixam nas categorias anteriores — dúvidas gerais, sugestões ou qualquer outro tema. Descreva sua necessidade com o máximo de detalhes possível.",
  },
};

export default function SupporteCategoryPage() {
  const params = useParams<{ category: string }>();
  const router = useRouter();
  const category = CATEGORIES[params.category];

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [pendingFile, setPendingFile] = useState<{
    url: string; key: string; type: string; name: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("chatAttachment", {
    onClientUploadComplete: (res) => {
      const file = res?.[0];
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const isImg = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
        setPendingFile({ url: file.url, key: file.key, type: isImg ? "image" : "document", name: file.name });
      }
      setUploading(false);
    },
    onUploadError: () => setUploading(false),
  });

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStores(data);
      });
  }, []);

  if (!category) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-gray-500">Categoria não encontrada.</p>
        <Link href="/chat" className="text-orange-600 text-sm mt-2 inline-block hover:underline">
          Voltar ao Suporte
        </Link>
      </div>
    );
  }

  const { label, Icon, color, description } = category;

  function toggleStore(id: string) {
    setSelectedStoreIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() && !pendingFile) return;
    setSubmitting(true);
    try {
      // 1. Get (or create) the franchisee's conversation
      const convRes = await fetch("/api/conversations");
      if (!convRes.ok) throw new Error("Falha ao obter conversa");
      const conv = await convRes.json();
      const conversationId: string = conv.id;

      // 2. Build the message content with category prefix
      const storeNames = selectedStoreIds
        .map((id) => stores.find((s) => s.id === id)?.name)
        .filter(Boolean)
        .join(", ");
      const prefix = storeNames ? `[${label}] — Loja: ${storeNames}` : `[${label}]`;
      const fullContent = message.trim() ? `${prefix}\n\n${message.trim()}` : prefix;

      // 3. Send message
      const body: Record<string, unknown> = {
        content: fullContent,
        category: params.category,
        linkedStoreIds: selectedStoreIds,
      };
      if (pendingFile) {
        body.fileUrl = pendingFile.url;
        body.fileKey = pendingFile.key;
        body.fileType = pendingFile.type;
        body.fileName = pendingFile.name;
      }

      const msgRes = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!msgRes.ok) throw new Error("Falha ao enviar mensagem");

      setDone(true);
      setTimeout(() => router.push("/chat"), 2000);
    } catch {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">Solicitação enviada!</h2>
        <p className="text-gray-500 text-sm">Redirecionando para o Suporte…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl">
      {/* Back */}
      <Link
        href="/chat"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-5"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar ao Suporte
      </Link>

      {/* Header */}
      <div className={`bg-gradient-to-br ${color} rounded-2xl px-5 py-4 mb-4 flex items-center gap-4`}>
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-xs text-white/70 font-semibold uppercase tracking-widest">Solicitação Rápida</p>
          <h1 className="text-lg font-bold text-white">{label}</h1>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
        <span className="text-gray-400 mt-0.5 flex-shrink-0">ℹ️</span>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Store picker */}
        {stores.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Loja(s) relacionada(s) <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {stores.map((store) => {
                const sel = selectedStoreIds.includes(store.id);
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => toggleStore(store.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                      sel
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {store.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Descreva sua solicitação
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder={`Descreva o problema ou solicitação de ${label.toLowerCase()}…`}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
          />
        </div>

        {/* File attachment */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Anexo <span className="text-gray-400 font-normal">(imagem ou documento)</span>
          </label>
          {pendingFile ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate flex-1">{pendingFile.name}</span>
              <button
                type="button"
                onClick={() => setPendingFile(null)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-orange-400 hover:text-orange-600 transition w-full justify-center"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
              {uploading ? "Enviando arquivo…" : "Adicionar imagem ou documento"}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setUploading(true);
                startUpload([file]);
              }
              e.target.value = "";
            }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || uploading || (!message.trim() && !pendingFile)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {submitting ? "Enviando…" : "Enviar Solicitação"}
        </button>
      </form>
    </div>
  );
}
