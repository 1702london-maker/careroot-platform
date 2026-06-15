const CACHE_NAME = "careroot-v1";
const OFFLINE_URL = "/carer/offline";

const PRECACHE = [
  "/",
  "/carer",
  "/carer/offline",
  "/manifest.json",
];

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
  // Network first for API calls
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok && event.request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
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

// Background sync for queued notes
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-notes") {
    event.waitUntil(syncQueuedNotes());
  }
});

async function syncQueuedNotes() {
  // IndexedDB sync happens here in production
}
