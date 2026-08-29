/*
 * Safaar web-user — minimal Service Worker.
 *
 * NEGA BU FAYL BOR:
 *   `components/pwa/ServiceWorkerRegister.tsx` production'da
 *   `navigator.serviceWorker.register("/sw.js")` chaqiradi. Bu fayl mavjud
 *   bo'lmaganida Vercel `/sw.js` uchun ilovaning HTML sahifasini
 *   (`Content-Type: text/html`) qaytarardi va brauzer konsolда har bir
 *   sahifada `The script has an unsupported MIME type ('text/html')` xatosi
 *   chiqardi (registratsiya rad etilardi).
 *
 * NIMA QILADI:
 *   Ataylab MINIMAL. Hech narsani KESH QILMAYDI — shu sababli eskirgan
 *   kontent xavfi yo'q. Faqat:
 *     - install/activate lifecycle (yangi versiya darhol faollashadi),
 *     - bo'sh `fetch` listener — PWA "installable" mezoni uchun kifoya,
 *       lekin `respondWith` chaqirmagani uchun tarmoq xatti-harakati
 *       o'zgarmaydi (brauzer odatdagidek yuklaydi).
 *
 * KEYINCHALIK OFFLINE/KESH KERAK BO'LSA:
 *   Bu faylni to'ldiring yoki `next-pwa`/`serwist` kabi vosita qo'shing —
 *   `ServiceWorkerRegister.tsx` allaqachon registratsiya qiladi.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Bo'sh — `respondWith` yo'q, demak brauzer so'rovni odatdagidek bajaradi.
self.addEventListener("fetch", () => {});
