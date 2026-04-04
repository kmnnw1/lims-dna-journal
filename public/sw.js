/* eslint-disable no-restricted-globals */

const CACHE_NAME = "lj-shell-v2";
const PRECACHE_ASSETS = [
  "/offline.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // Пропускаем ожидание даже при ошибке — важно для апгрейда!
        console.warn("[SW] Cache install error:", err);
        self.skipWaiting();
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    // Удаляем старые кэши, если есть
    caches.keys().then((names) =>
      Promise.all(
        names.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Используем network-first для HTML, cache-first для статики
  if (
    req.mode === "navigate" ||
    req.headers.get("Accept")?.includes("text/html")
  ) {
    // HTML-запросы: сеть с fallback в offline.html
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Опционально — можно добавить динамическое кэширование HTML страниц тут
          return res;
        })
        .catch(() =>
          caches.match("/offline.html")
        )
    );
    return;
  }

  // Для статических ассетов — cache first, fallback в сеть
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Опционально: загружаемое можно кэшировать динамически
          // копируем response (res.body считается уже потоковым и может быть использован только 1 раз)
          if (
            res.status === 200 &&
            res.type === "basic" &&
            PRECACHE_ASSETS.some((path) => req.url.includes(path))
          ) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(req, resClone)
            ).catch(() => {});
          }
          return res;
        })
        .catch(() => {
          // Ничего не нашли — network и cache оба не сработали
          return undefined;
        });
    })
  );
});
