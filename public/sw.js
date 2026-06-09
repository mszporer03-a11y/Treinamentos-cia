// Service Worker para notificações push e PWA offline
const CACHE_NAME = "treinamentos-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Notificação", body: event.data.text() };
  }

  const { title = "Portal de Treinamentos", body = "", url = "/" } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url },
      vibrate: [200, 100, 200],
    })
  );
});

// Ao clicar na notificação, abrir/focar a aba correspondente
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin));
        if (existing) {
          existing.focus();
          existing.navigate(targetUrl);
        } else {
          self.clients.openWindow(targetUrl);
        }
      })
  );
});
