const CACHE_NAME = "careroot-v7";
const OFFLINE_URL = "/carer/offline";
const ALLOWED_FETCH_PREFIXES = [
  "/api/",
  "/_next/static/",
  "/carer",
  "/dashboard",
  "/login",
  "/manifest.json",
  "/favicon",
  "/icon-",
  "/icons/",
];

const PRECACHE = [
  "/",
  "/carer",
  "/carer/offline",
  "/manifest.json",
];

function safeSameOriginPath(request) {
  const originPrefix = `${self.location.origin}/`;
  if (!request.url.startsWith(originPrefix)) {
    return null;
  }

  const path = request.url.slice(self.location.origin.length);
  const lowerPath = path.toLowerCase();
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    lowerPath.includes("%5c") ||
    lowerPath.includes("%2f%2f") ||
    !ALLOWED_FETCH_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))
  ) {
    return null;
  }

  return path;
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
  const requestPath = safeSameOriginPath(event.request);

  if (!requestPath) {
    return;
  }

  const safeRequest = new Request(`${self.location.origin}${requestPath}`, event.request);

  // Network first for API calls
  if (requestPath.startsWith("/api/")) {
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

