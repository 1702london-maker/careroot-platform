"use client";

import { useEffect } from "react";
import { flushOfflineQueue } from "@/lib/offline-queue";

export function OfflineFlushProvider() {
  useEffect(() => {
    // Flush any queued offline submissions when connectivity returns
    const handleOnline = () => { flushOfflineQueue(); };
    window.addEventListener("online", handleOnline);
    // Also attempt flush on mount in case we're already online with pending items
    flushOfflineQueue();
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}
