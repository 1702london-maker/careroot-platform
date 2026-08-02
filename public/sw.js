const CACHE_NAME = "careroot-v8";
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

self.addEventListener("sync", (event) => {
  if (event.tag !== "careroot-offline-sync") return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: "CAREROOT_FLUSH_OFFLINE_QUEUE" }));
    })
  );
});

