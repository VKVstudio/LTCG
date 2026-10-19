/* ============================================================
   LTCG — sw.js · самоочистка устаревшего Service Worker
   Удаляет старые кеши и снимает регистрацию, чтобы браузер не
   блокировал Back/Forward Cache (bfcache) и не держал старые
   версии страниц.
   ============================================================ */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
  })());
});
