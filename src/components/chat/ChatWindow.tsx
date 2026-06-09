"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Download,
  Loader2,
  Tag,
  Store,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-components";
import { formatDate } from "@/lib/utils";

const MESSAGE_CATEGORIES = [
  { value: "solicitacoes",   label: "Solicitações",       color: "bg-blue-100 text-blue-700" },
  { value: "marketing",      label: "Mídia",                color: "bg-purple-100 text-purple-700" },
  { value: "senhas-usuarios",label: "Senhas e usuários",   color: "bg-orange-100 text-orange-700" },
  { value: "suporte-sistema",label: "Suporte Sistema",     color: "bg-cyan-100 text-cyan-700" },
  { value: "outros",         label: "Outros",              color: "bg-gray-100 text-gray-600" },
] as const;

// Legacy camelCase values (kept for backward compat with older messages)
const LEGACY_CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  Solicitacoes:   { label: "Solicitações",     color: "bg-blue-100 text-blue-700" },
  Marketing:      { label: "Mídia",             color: "bg-purple-100 text-purple-700" },
  SenhasUsuarios: { label: "Senhas e usuários", color: "bg-orange-100 text-orange-700" },
  SuporteSistema: { label: "Suporte Sistema",   color: "bg-cyan-100 text-cyan-700" },
};

type MessageCategoryValue = typeof MESSAGE_CATEGORIES[number]["value"];

function categoryBadge(value: string | null | undefined) {
  if (!value) return null;
  const cat = MESSAGE_CATEGORIES.find((c) => c.value === value) ?? LEGACY_CATEGORY_MAP[value];
  if (!cat) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${cat.color}`}>
      <Tag className="h-2.5 w-2.5" />
      {cat.label}
    </span>
  );
}

interface Sender {
  id: string;
  name: string;
  role: string;
}

interface LinkedStore {
  id: string;
  name: string;
  code: string;
}

interface Message {
  id: string;
  content: string | null;
  fileUrl: string | null;
  fileType: string | null;
  fileName: string | null;
  category: string | null;
  createdAt: string;
  sender: Sender;
  linkedStores?: { store: LinkedStore }[];
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  currentUserRole: "ADMIN" | "FRANCHISEE";
  recipientName?: string;
  pollInterval?: number;
  availableStores?: LinkedStore[];
}

function FilePreview({ url, type, name }: { url: string; type: string | null; name: string | null }) {
  const isImage = type === "image" || (name ? /\.(jpg|jpeg|png|gif|webp)$/i.test(name) : false);

  if (isImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? "imagem"}
        className="max-w-[240px] max-h-[200px] rounded-lg object-cover cursor-pointer"
        onClick={() => window.open(url, "_blank")}
      />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition text-sm"
    >
      <FileText className="h-4 w-4 flex-shrink-0" />
      <span className="truncate max-w-[160px]">{name ?? "arquivo"}</span>
      <Download className="h-3 w-3 flex-shrink-0" />
    </a>
  );
}

export function ChatWindow({
  conversationId,
  currentUserId,
  currentUserRole,
  recipientName = "Admin",
  pollInterval = 4000,
  availableStores = [],
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [category, setCategory] = useState<MessageCategoryValue | "">("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    url: string;
    key: string;
    type: string;
    name: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("chatAttachment", {
    onClientUploadComplete: (res) => {
      const file = res?.[0];
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const isImg = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
        setPendingFile({
          url: file.url,
          key: file.key,
          type: isImg ? "image" : "document",
          name: file.name,
        });
      }
      setUploading(false);
    },
    onUploadError: () => setUploading(false),
  });

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, pollInterval);
    return () => clearInterval(id);
  }, [fetchMessages, pollInterval]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() && !pendingFile) return;
    setSending(true);

    await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: text.trim() || null,
        fileUrl: pendingFile?.url ?? null,
        fileKey: pendingFile?.key ?? null,
        fileType: pendingFile?.type ?? null,
        fileName: pendingFile?.name ?? null,
        category: category || null,
        linkedStoreIds: selectedStoreIds,
      }),
    });

    setText("");
    setPendingFile(null);
    setCategory("");
    setSelectedStoreIds([]);
    setShowCategoryPicker(false);
    setShowStorePicker(false);
    setSending(false);
    await fetchMessages();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await startUpload([file]);
    e.target.value = "";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
          {recipientName[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{recipientName}</p>
          <p className="text-xs text-gray-400">
            {currentUserRole === "ADMIN" ? "Franqueado" : "Admin"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            Nenhuma mensagem ainda. Diga olá! 👋
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender.id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  isMe ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {msg.sender.name[0]?.toUpperCase()}
              </div>

              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {!isMe && (
                  <span className="text-[10px] text-gray-400 px-1">{msg.sender.name}</span>
                )}
                {msg.category && (
                  <div className={isMe ? "self-end pr-1" : "self-start pl-1"}>
                    {categoryBadge(msg.category)}
                  </div>
                )}
                {msg.linkedStores && msg.linkedStores.length > 0 && (
                  <div className={`flex flex-wrap gap-1 ${isMe ? "self-end pr-1" : "self-start pl-1"}`}>
                    {msg.linkedStores.map(({ store }) => (
                      <span key={store.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                        <Store className="h-2.5 w-2.5" />
                        {store.name}
                      </span>
                    ))}
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-gray-900 shadow-sm rounded-bl-sm"
                  }`}
                >
                  {msg.fileUrl && (
                    <div className="mb-1">
                      <FilePreview url={msg.fileUrl} type={msg.fileType} name={msg.fileName} />
                    </div>
                  )}
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                </div>
                <span className="text-[10px] text-gray-400 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Pending file preview */}
      {pendingFile && (
        <div className="mx-4 mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-sm text-blue-700">
          {pendingFile.type === "image" ? (
            <ImageIcon className="h-4 w-4 flex-shrink-0" />
          ) : (
            <FileText className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="truncate flex-1">{pendingFile.name}</span>
          <button onClick={() => setPendingFile(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
        {/* Store picker */}
        {availableStores.length > 0 && showStorePicker && (
          <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="w-full text-[10px] text-emerald-700 font-semibold mb-1">Vincular à loja:</p>
            {availableStores.map((store) => {
              const selected = selectedStoreIds.includes(store.id);
              return (
                <button
                  key={store.id}
                  onClick={() => setSelectedStoreIds((prev) =>
                    selected ? prev.filter((id) => id !== store.id) : [...prev, store.id]
                  )}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                    selected
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {store.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected stores badges */}
        {selectedStoreIds.length > 0 && !showStorePicker && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {selectedStoreIds.map((id) => {
              const store = availableStores.find((s) => s.id === id);
              if (!store) return null;
              return (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  <Store className="h-3 w-3" />
                  {store.name}
                  <button onClick={() => setSelectedStoreIds((prev) => prev.filter((i) => i !== id))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Category picker (shows when open) */}
        {showCategoryPicker && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              onClick={() => { setCategory(""); setShowCategoryPicker(false); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                category === "" ? "bg-gray-200 border-gray-400 text-gray-800" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              Sem categoria
            </button>
            {MESSAGE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setShowCategoryPicker(false); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                  category === cat.value ? cat.color + " border-transparent" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Selected category badge */}
        {category && !showCategoryPicker && (
          <div className="flex items-center gap-1.5 mb-2">
            {categoryBadge(category)}
            <button
              onClick={() => setCategory("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition flex-shrink-0"
            title="Anexar arquivo"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Category tag button */}
          <button
            type="button"
            onClick={() => setShowCategoryPicker((v) => !v)}
            className={`p-2 rounded-xl transition flex-shrink-0 ${
              category
                ? "text-blue-600 bg-blue-50"
                : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            }`}
            title="Categorizar mensagem"
          >
            <Tag className="h-5 w-5" />
          </button>

          {/* Link to store button */}
          {availableStores.length > 0 && (
            <button
              type="button"
              onClick={() => setShowStorePicker((v) => !v)}
              className={`p-2 rounded-xl transition flex-shrink-0 ${
                selectedStoreIds.length > 0
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
              }`}
              title="Vincular à loja"
            >
              <Store className="h-5 w-5" />
            </button>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Digite uma mensagem..."
            className="flex-1 resize-none bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 overflow-y-auto"
            style={{ minHeight: "40px" }}
          />

          <button
            onClick={handleSend}
            disabled={sending || uploading || (!text.trim() && !pendingFile)}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
