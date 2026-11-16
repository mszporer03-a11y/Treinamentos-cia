"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Paperclip, X, Loader2, Tag, Store } from "lucide-react";
import { type Attachment, messageAttachments } from "@/lib/attachments";
import { AttachmentMosaic } from "@/components/attachments/AttachmentMosaic";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { AttachmentPickerList } from "@/components/attachments/AttachmentPicker";
import { useAttachmentUploader } from "@/components/attachments/useAttachmentUploader";
import { formatDate } from "@/lib/utils";

const MESSAGE_CATEGORIES = [
  { value: "solicitacoes",   label: "Solicitações (Geral)", color: "bg-blue-100 text-blue-700" },
  { value: "marketing",      label: "Mídia",                color: "bg-purple-100 text-purple-700" },
  { value: "senhas-usuarios",label: "Senhas e usuários",   color: "bg-orange-100 text-orange-700" },
  { value: "suporte-sistema",label: "Suporte Sistema",     color: "bg-cyan-100 text-cyan-700" },
  { value: "outros",         label: "Outros",              color: "bg-gray-100 text-gray-600" },
] as const;

// Legacy camelCase values (kept for backward compat with older messages)
const LEGACY_CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  Solicitacoes:   { label: "Solicitações (Geral)", color: "bg-blue-100 text-blue-700" },
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
  attachments?: unknown;
  category: string | null;
  createdAt: string;
  sender: Sender;
  linkedStores?: { store: LinkedStore }[];
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  currentUserRole: "ADMIN" | "FRANCHISEE" | "MANAGER";
  recipientName?: string;
  recipientRole?: string;
  pollInterval?: number;
  availableStores?: LinkedStore[];
  readOnly?: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  FRANCHISEE: "Franqueado",
  MANAGER: "Gerente",
};

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(d, today)) return "Hoje";
  if (sameDay(d, yesterday)) return "Ontem";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ChatWindow({
  conversationId,
  currentUserId,
  currentUserRole,
  recipientName = "Admin",
  recipientRole,
  pollInterval = 4000,
  availableStores = [],
  readOnly = false,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [category, setCategory] = useState<MessageCategoryValue | "">("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const uploader = useAttachmentUploader("chatAttachment");
  const uploading = uploader.busy;
  const hasAttachments = uploader.attachments.length > 0;
  const [gallery, setGallery] = useState<Attachment[] | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!text.trim() && !hasAttachments) || uploading) return;
    setSending(true);

    await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: text.trim() || null,
        attachments: uploader.attachments,
        category: category || null,
        linkedStoreIds: selectedStoreIds,
      }),
    });

    setText("");
    uploader.reset();
    setCategory("");
    setSelectedStoreIds([]);
    setShowCategoryPicker(false);
    setShowStorePicker(false);
    setSending(false);
    await fetchMessages();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    uploader.addFiles(e.target.files);
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
            {recipientRole
              ? ROLE_LABEL[recipientRole] ?? recipientRole
              : currentUserRole === "ADMIN"
              ? "Franqueado"
              : "Admin"}
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
        {messages.map((msg, idx) => {
          const isMe = msg.sender.id === currentUserId;
          const prevMsg = messages[idx - 1];
          const showDayDivider =
            !prevMsg ||
            new Date(prevMsg.createdAt).toDateString() !==
              new Date(msg.createdAt).toDateString();
          return (
            <div key={msg.id}>
              {showDayDivider && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {dayLabel(msg.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}
            <div
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
                  {messageAttachments(msg).length > 0 && (
                    <div className="mb-1 w-[220px] sm:w-[260px]">
                      <AttachmentMosaic
                        variant="chat"
                        attachments={messageAttachments(msg)}
                        onOpen={() => setGallery(messageAttachments(msg))}
                      />
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
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Read-only notice (conversa de histórico) */}
      {readOnly && (
        <div className="px-4 py-3 bg-gray-100 border-t border-gray-200 text-center text-xs text-gray-500 flex-shrink-0">
          Esta conversa é um histórico — para falar com a equipe, inicie uma conversa com um administrador.
        </div>
      )}

      {/* Anexos pendentes (vários por mensagem) */}
      {!readOnly && uploader.items.length > 0 && (
        <div className="mx-4 mb-2 max-h-48 overflow-y-auto">
          <AttachmentPickerList uploader={uploader} compact />
        </div>
      )}

      {/* Input bar */}
      {!readOnly && (
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
            title="Anexar arquivos"
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
            accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            multiple
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
            disabled={sending || uploading || (!text.trim() && !hasAttachments)}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
      )}

      {gallery && <AttachmentGallery attachments={gallery} title="Anexos da mensagem" onClose={() => setGallery(null)} />}
    </div>
  );
}
