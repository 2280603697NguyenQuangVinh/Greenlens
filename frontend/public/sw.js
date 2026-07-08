const CACHE_NAME = "greenlens-kids-v1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/pwa/icon-192.png", "/pwa/icon-512.png", "/pwa/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

function isApiRequest(url) {
  return (
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/child-profiles") ||
    url.pathname.startsWith("/quiz") ||
    url.pathname.startsWith("/ai-camera") ||
    url.pathname.startsWith("/mini-games") ||
    url.pathname.startsWith("/users") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/api")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (isApiRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/")),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const responseToCache = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        return response;
      });
    }),
  );
});
