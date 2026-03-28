/* eslint-disable no-restricted-globals */
const CACHE = "lj-shell-v1";
const PRECACHE = ["/offline.html", "/manifest.json", "/icon-192.png", "/icon-512.png", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    fetch(req)
      .then((res) => res)
      .catch(() =>
        caches.match(req).then((cached) => {
          if (cached) return cached;
          if (req.mode === "navigate" || req.headers.get("Accept")?.includes("text/html")) {
            return caches.match("/offline.html");
          }
          return Promise.reject(new Error("offline"));
        })
      )
  );
});
