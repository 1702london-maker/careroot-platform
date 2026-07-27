"use client";

export type OfflineQueueItem = {
  id: string;
  endpoint: string;
  method: "POST" | "PATCH";
  body: Record<string, unknown>;
  createdAt: string;
  attempts: number;
};

const QUEUE_KEY = "careroot_pending_sync";

function readQueue(): OfflineQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as OfflineQueueItem[];
  } catch {
    return [];
  }
}

function writeQueue(items: OfflineQueueItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("careroot:offline-queue"));
}

export function getPendingSyncCount() {
  return readQueue().length;
}

export function queueOfflineRequest(endpoint: string, body: Record<string, unknown>, method: "POST" | "PATCH" = "POST") {
  const item: OfflineQueueItem = {
    id: crypto.randomUUID(),
    endpoint,
    method,
    body,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  writeQueue([...readQueue(), item]);
  return item;
}

export async function submitOrQueue(endpoint: string, body: Record<string, unknown>, method: "POST" | "PATCH" = "POST") {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    queueOfflineRequest(endpoint, body, method);
    return { queued: true, ok: true, status: 202, data: null, error: null };
  }

  try {
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { queued: false, ok: false, status: res.status, data, error: data?.error || "Request failed" };
    return { queued: false, ok: true, status: res.status, data, error: null };
  } catch (error) {
    queueOfflineRequest(endpoint, body, method);
    return { queued: true, ok: true, status: 202, data: null, error: error instanceof Error ? error.message : null };
  }
}

export async function flushOfflineQueue() {
  const queue = readQueue();
  if (queue.length === 0 || (typeof navigator !== "undefined" && !navigator.onLine)) return { synced: 0, remaining: queue.length };

  const remaining: OfflineQueueItem[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      const res = await fetch(item.endpoint, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (res.ok) {
        synced += 1;
      } else {
        remaining.push({ ...item, attempts: item.attempts + 1 });
      }
    } catch {
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  writeQueue(remaining);
  return { synced, remaining: remaining.length };
}
