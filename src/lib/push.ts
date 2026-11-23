import webpush from "web-push";
import { db } from "@/lib/db";

if (
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

// No Android (Chrome → FCM), mensagens de prioridade normal são atrasadas ou
// descartadas quando o aparelho está em Doze/otimização de bateria. Como toda
// notificação aqui exibe algo para o usuário (userVisibleOnly), enviamos sempre
// com urgência alta e um TTL longo para que o FCM entregue assim que possível.
const SEND_OPTIONS: webpush.RequestOptions = {
  TTL: 24 * 60 * 60, // 24h — se não entregar nesse prazo, descarta
  urgency: "high",
};

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string };

// Envia uma notificação para uma inscrição, removendo-a se estiver expirada
// (410/404) e logando qualquer outra falha para diagnóstico.
async function sendToSubscription(sub: SubRow, data: string) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      data,
      SEND_OPTIONS
    );
  } catch (err: unknown) {
    const error = err as { statusCode?: number; body?: string };
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      // Inscrição expirada/cancelada — remover
      await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    } else {
      // Falha inesperada (rate limit, payload, rede...) — logar para diagnóstico
      console.error(
        `[push] falha ao enviar (status ${error?.statusCode ?? "?"}):`,
        error?.body ?? error
      );
    }
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PRIVATE_KEY) return;

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  const data = JSON.stringify(payload);
  await Promise.allSettled(subscriptions.map((sub) => sendToSubscription(sub, data)));
}

export async function sendPushToAll(payload: PushPayload, audience?: "ADMIN" | "NON_ADMIN") {
  if (!process.env.VAPID_PRIVATE_KEY) return;

  const subscriptions = await db.pushSubscription.findMany({
    include: { user: { select: { role: true, active: true } } },
  });

  const filtered = subscriptions.filter((s) => {
    if (!s.user.active) return false;
    if (audience === "ADMIN") return s.user.role === "ADMIN";
    if (audience === "NON_ADMIN") return s.user.role !== "ADMIN";
    return true;
  });

  const data = JSON.stringify(payload);
  await Promise.allSettled(filtered.map((sub) => sendToSubscription(sub, data)));
}
