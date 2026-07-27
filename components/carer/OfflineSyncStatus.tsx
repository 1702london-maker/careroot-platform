"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2, WifiOff } from "lucide-react";
import { flushOfflineQueue, getPendingSyncCount } from "@/lib/offline-queue";

export function OfflineSyncStatus() {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setPending(getPendingSyncCount());
    const sync = async () => {
      refresh();
      if (!navigator.onLine || getPendingSyncCount() === 0) return;
      setSyncing(true);
      const result = await flushOfflineQueue();
      setSyncing(false);
      refresh();
      if (result.synced > 0) setLastSynced(new Date().toISOString());
    };

    refresh();
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("careroot:offline-queue", refresh);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("careroot:offline-queue", refresh);
    };
  }, []);

  if (pending === 0 && !lastSynced) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-xs text-cr-slate shadow-sm">
      {pending > 0 ? (
        <div className="flex items-center gap-2 font-semibold text-amber-700">
          {syncing ? <Loader2 size={14} className="animate-spin" /> : <WifiOff size={14} />}
          {pending} record{pending === 1 ? "" : "s"} waiting to sync
        </div>
      ) : (
        <div className="flex items-center gap-2 font-semibold text-green-700">
          <CheckCircle size={14} />
          Offline records synced{lastSynced ? ` at ${new Date(lastSynced).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}
        </div>
      )}
    </div>
  );
}
