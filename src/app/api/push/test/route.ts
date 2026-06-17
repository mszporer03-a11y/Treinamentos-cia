import webpush from "web-push";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const vapidConfigured = !!(
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
);

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

// GET /api/push/test — status do push para o usuário atual (sem enviar nada)
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const subscriptionCount = await db.pushSubscription.count({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ vapidConfigured, subscriptionCount });
}

// POST /api/push/test — envia uma notificação de teste para o próprio usuário
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const subs = await db.pushSubscription.findMany({ where: { userId: session.user.id } });

  if (!vapidConfigured) {
    return NextResponse.json({
      ok: false,
      vapidConfigured: false,
      subscriptionCount: subs.length,
      reason: "As chaves VAPID não estão configuradas no servidor (Railway).",
    });
  }

  if (subs.length === 0) {
    return NextResponse.json({
      ok: false,
      vapidConfigured: true,
      subscriptionCount: 0,
      reason:
        "Nenhuma inscrição encontrada para você. Ative as notificações neste aparelho primeiro.",
    });
  }

  const payload = JSON.stringify({
    title: "🔔 Teste de notificação",
    body: "Funcionou! As notificações deste aparelho estão ativas.",
    url: "/",
  });

  const results = await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        return { ok: true as const };
      } catch (err: unknown) {
        const e = err as { statusCode?: number; body?: string };
        // Remove inscrições inválidas (expiradas/revogadas)
        if (e?.statusCode === 410 || e?.statusCode === 404) {
          await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
        return { ok: false as const, statusCode: e?.statusCode, body: e?.body };
      }
    })
  );

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;

  return NextResponse.json({
    ok: sent > 0,
    vapidConfigured: true,
    subscriptionCount: subs.length,
    sent,
    failed,
    results,
    reason:
      sent > 0
        ? undefined
        : "O servidor tentou enviar mas todas as inscrições falharam (veja os detalhes).",
  });
}
