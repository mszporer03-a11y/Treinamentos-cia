"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Smartphone, Share, Plus, MoreVertical, Download, ChevronLeft } from "lucide-react";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstalarPage() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferred(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-xl mx-auto">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5">
          <ChevronLeft className="h-4 w-4" /> Voltar ao login
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Image src="/icon.png" alt="" width={56} height={56} className="rounded-2xl shadow" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Instalar o app</h1>
            <p className="text-sm text-gray-500">Portal Companhia do Churrasco no seu celular</p>
          </div>
        </div>

        {installed && (
          <p className="mb-4 rounded-xl bg-green-50 text-green-700 text-sm px-4 py-3">
            App instalado! Abra pelo ícone na tela inicial.
          </p>
        )}

        {/* Android */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Smartphone className="h-5 w-5 text-green-600" /> Android
          </h2>
          {deferred && (
            <button
              onClick={install}
              className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition"
            >
              <Download className="h-5 w-5" /> Instalar agora
            </button>
          )}
          <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
            <li>
              Abra este endereço no <b>Google Chrome</b>.
            </li>
            <li className="flex items-center gap-1 flex-wrap">
              Toque no menu <MoreVertical className="h-4 w-4 inline" /> (três pontinhos) no canto superior.
            </li>
            <li>
              Escolha <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).
            </li>
            <li>Confirme. O ícone aparece na tela inicial, como um aplicativo.</li>
          </ol>
        </section>

        {/* iOS */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Smartphone className="h-5 w-5 text-sky-600" /> iPhone / iPad (iOS)
          </h2>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
            <li>
              Abra este endereço no <b>Safari</b> (não funciona em outros navegadores no iOS).
            </li>
            <li className="flex items-center gap-1 flex-wrap">
              Toque em <Share className="h-4 w-4 inline" /> <b>Compartilhar</b>, na barra inferior.
            </li>
            <li className="flex items-center gap-1 flex-wrap">
              Role e toque em <Plus className="h-4 w-4 inline" /> <b>Adicionar à Tela de Início</b>.
            </li>
            <li>
              Toque em <b>Adicionar</b>. Abra o app pelo ícone e ative as notificações quando solicitado.
            </li>
          </ol>
        </section>

        <p className="text-xs text-gray-400 text-center">
          O app instalado funciona em tela cheia e recebe notificações de novidades e solicitações.
        </p>
      </div>
    </div>
  );
}
