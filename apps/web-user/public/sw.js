/* Safaar PWA Service Worker — Cache First for static, Network First for navigation, Web Push & Offline Fallbacks. */

const CACHE_PREFIX = "safaar-cache";
const CACHE_NAME = `${CACHE_PREFIX}-v1.3.0`;

// Offline fallback sahifalari
const OFFLINE_URLS = ["/uz/offline", "/ru/offline", "/en/offline"];
const DEFAULT_OFFLINE = "/uz/offline";

// Statik aktivlar (Cache First)
const STATIC_ASSET_RE = /\.(?:css|js|woff2?|png|jpe?g|svg|webp|ico|webmanifest)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function offlineFallbackFor(url) {
  try {
    const segment = new URL(url).pathname.split("/").filter(Boolean)[0];
    const candidate = "/" + segment + "/offline";
    if (OFFLINE_URLS.includes(candidate)) return candidate;
  } catch {
    /* noop */
  }
  return DEFAULT_OFFLINE;
}

/* ───────────────────────── Fetch Event ───────────────────────── */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/_next/data")) return;
  if (url.searchParams.has("_rsc")) return;

  // 1) Sahifa navigatsiyasi: Network First (with Offline Fallback)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(offlineFallbackFor(request.url))
          .then((cached) => cached || caches.match(DEFAULT_OFFLINE))
      )
    );
    return;
  }

  // 2) Static Assets & Shriftlar: Cache First (with Network Update)
  const isStatic =
    url.pathname.startsWith("/_next/static") || STATIC_ASSET_RE.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }
});

/* ───────────────────────── Web Push Notifications ───────────────────────── */

self.addEventListener("push", (event) => {
  let payload = {
    title: "Safaar — Bron Bildirishnomasi",
    body: "Sizning broningiz holati muvaffaqiyatli yangilandi.",
    icon: "/globe.svg",
    badge: "/globe.svg",
    url: "/uz/account/bookings",
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = { ...payload, ...data };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || "/globe.svg",
    badge: payload.badge || "/globe.svg",
    data: {
      url: payload.url || "/uz/account/bookings",
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: "open", title: "Bronni ko'rish" },
      { action: "close", title: "Yopish" },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

/* ───────────────────────── Notification Click Event ───────────────────────── */

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const targetUrl =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/uz/account/bookings";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          if ("navigate" in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
