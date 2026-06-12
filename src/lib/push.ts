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

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PRIVATE_KEY) return;

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  const data = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data
        );
      } catch (err: unknown) {
        // Remove subscriptions that are no longer valid (410 Gone)
        const error = err as { statusCode?: number };
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          await db.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );
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

  await Promise.allSettled(
    filtered.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data
        );
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          await db.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );
}
