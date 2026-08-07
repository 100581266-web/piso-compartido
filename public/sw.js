// Minimal service worker: no offline caching (explicitly out of scope for
// the MVP), it only exists so Chrome's PWA install criteria are met, and to
// receive Web Push notifications.
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Piso Compartido", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Piso Compartido", {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { link: payload.link || "/household" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/household";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(link);
      }
    })
  );
});
