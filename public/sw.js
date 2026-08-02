const CACHE_NAME = "careroot-v6";
const OFFLINE_URL = "/carer/offline";

const PRECACHE = [
  "/",
  "/carer",
  "/carer/offline",
  "/manifest.json",
];

function safeSameOriginUrl(request) {
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.protocol !== "https:") {
    return null;
  }
  return requestUrl;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = safeSameOriginUrl(event.request);

  if (!requestUrl) {
    return;
  }

  const safeRequest = new Request(requestUrl.href, event.request);

  // Network first for API calls
  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(safeRequest).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(safeRequest).then((cached) => {
      if (cached) return cached;
      return fetch(safeRequest)
        .then((response) => {
          if (response.ok && safeRequest.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(safeRequest, clone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL) || new Response("Offline", { status: 503 });
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag !== "careroot-offline-sync") return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: "CAREROOT_FLUSH_OFFLINE_QUEUE" }));
    })
  );
});

