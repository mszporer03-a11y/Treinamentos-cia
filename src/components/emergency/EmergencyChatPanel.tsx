"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Paperclip, Loader2, Lock, Siren } from "lucide-react";
import { type Attachment, genericAttachments } from "@/lib/attachments";
import { AttachmentMosaic } from "@/components/attachments/AttachmentMosaic";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { AttachmentPickerList } from "@/components/attachments/AttachmentPicker";
import { useAttachmentUploader } from "@/components/attachments/useAttachmentUploader";

export interface EmergencyChat {
  id: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  closedAt: string | null;
  franchisee: { id: string; name: string; email: string };
  store: { id: string; name: string; code: string } | null;
  openedBy: { id: string; name: string } | null;
  closedBy: { id: string; name: string } | null;
}

interface EmergencyMessage {
  id: string;
  content: string | null;
  attachments: unknown;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

const fmt = (d: string) =>
  new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function EmergencyChatPanel({
  chatId,
  currentUserId,
  isAdmin,
  onChange,
}: {
  chatId: string;
  currentUserId: string;
  isAdmin: boolean;
  /** Chamado quando a sessão muda de estado (ex.: encerrada) */
  onChange?: (chat: EmergencyChat) => void;
}) {
  const [chat, setChat] = useState<EmergencyChat | null>(null);
  const [messages, setMessages] = useState<EmergencyMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const [gallery, setGallery] = useState<Attachment[] | null>(null);
  const uploader = useAttachmentUploader("chatAttachment");
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);
  const statusRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/emergency/${chatId}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    setChat(data.chat);
    setMessages(data.messages);
    if (statusRef.current && statusRef.current !== data.chat.status) onChange?.(data.chat);
    statusRef.current = data.chat.status;
  }, [chatId, onChange]);

  useEffect(() => {
    statusRef.current = null;
    lastCount.current = 0;
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (messages.length !== lastCount.current) {
      lastCount.current = messages.length;
      // Rola só a lista de mensagens (não a página inteira)
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const isOpen = chat?.status === "OPEN";
  const canSend = isOpen && (text.trim() || uploader.attachments.length > 0) && !uploader.busy && !sending;

  async function send() {
    if (!canSend) return;
    setSending(true);
    setError("");
    const res = await fetch(`/api/emergency/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim() || null, attachments: uploader.attachments }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao enviar");
      await load();
      return;
    }
    setText("");
    uploader.reset();
    await load();
  }

  async function closeChat() {
    if (!confirm("Encerrar o chat emergencial? O usuário não poderá mais enviar mensagens até a Franquia iniciar um novo contato.")) return;
    setClosing(true);
    const res = await fetch(`/api/emergency/${chatId}/close`, { method: "POST" });
    setClosing(false);
    if (res.ok) {
      const updated = await res.json();
      setChat(updated);
      statusRef.current = updated.status;
      onChange?.(updated);
    }
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded mb-1">
            <Siren className="h-3 w-3" /> CHAT EMERGENCIAL
          </span>
          <p className="font-semibold text-gray-900 text-sm truncate">
            {isAdmin
              ? `Conversa com: ${chat.franchisee.name}${chat.store ? ` (${chat.store.name})` : ""}`
              : `Franquia${chat.openedBy ? ` — ${chat.openedBy.name}` : ""}`}
          </p>
        </div>
        {isAdmin && isOpen && (
          <button
            onClick={closeChat}
            disabled={closing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition flex-shrink-0"
          >
            <Lock className="h-3.5 w-3.5" /> Encerrar Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/60 min-h-0">
        <p className="text-center text-xs text-gray-400">
          Sessão iniciada {chat.openedBy ? `por ${chat.openedBy.name} ` : "pelo Administrador "}em {fmt(chat.createdAt)}.
          {isAdmin ? " O usuário foi notificado." : ""}
        </p>
        {messages.map((msg) => {
          const isMe = msg.sender.id === currentUserId;
          const attachments = genericAttachments(msg.attachments);
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              {!isMe && <span className="text-[10px] text-gray-400 px-1 mb-0.5">{msg.sender.name}</span>}
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  isMe ? "bg-red-600 text-white rounded-br-sm" : "bg-white text-gray-900 shadow-sm rounded-bl-sm"
                }`}
              >
                {attachments.length > 0 && (
                  <div className="mb-1 w-[220px] sm:w-[260px]">
                    <AttachmentMosaic variant="chat" attachments={attachments} onOpen={() => setGallery(attachments)} />
                  </div>
                )}
                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
              </div>
              <span className="text-[10px] text-gray-400 px-1 mt-0.5">{fmt(msg.createdAt)}</span>
            </div>
          );
        })}
        {!isOpen && (
          <div className="text-center text-xs text-gray-500 bg-gray-100 rounded-lg py-2 px-3">
            🔒 Sessão encerrada{chat.closedBy ? ` por ${chat.closedBy.name}` : ""}
            {chat.closedAt ? ` em ${fmt(chat.closedAt)}` : ""}.
            {!isAdmin && " Novas mensagens só serão possíveis quando a Franquia iniciar um novo contato."}
          </div>
        )}
      </div>

      {/* Input */}
      {isOpen ? (
        <div className="border-t border-gray-200 px-3 py-3 flex-shrink-0">
          {uploader.items.length > 0 && (
            <div className="mb-2 max-h-40 overflow-y-auto">
              <AttachmentPickerList uploader={uploader} compact />
            </div>
          )}
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition flex-shrink-0"
              title="Anexar arquivos"
            >
              {uploader.busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              className="hidden"
              onChange={(e) => {
                uploader.addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Digite sua mensagem aqui..."
              className="flex-1 resize-none bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 max-h-32"
              style={{ minHeight: "40px" }}
            />
            <button
              onClick={send}
              disabled={!canSend}
              className="p-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl transition flex-shrink-0"
              title="Enviar"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}

      {gallery && <AttachmentGallery attachments={gallery} title="Anexos" onClose={() => setGallery(null)} />}
    </div>
  );
}
