"use client";

import { useEffect, useState } from "react";
import { Clock, WifiOff, User2, MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CachedVisit {
  id: string;
  client_name: string;
  address: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  visit_type: string;
}

export default function OfflinePage() {
  const [cachedVisits, setCachedVisits] = useState<CachedVisit[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    // Read from localStorage cache written by the service worker / carer dashboard
    try {
      const raw = localStorage.getItem("careroot_cached_visits");
      if (raw) setCachedVisits(JSON.parse(raw) as CachedVisit[]);
      const sync = localStorage.getItem("careroot_last_sync");
      if (sync) setLastSync(sync);
    } catch {
      // ignore
    }
  }, []);

  const statusColor: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-cr-mint text-cr-forest",
    completed: "bg-green-100 text-green-700",
    missed: "bg-red-100 text-cr-red",
  };

  return (
    <div className="min-h-screen bg-cr-forest text-white">
      {/* Header */}
      <div className="px-5 pt-14 pb-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 mb-4">
          <WifiOff size={28} className="text-white" />
        </div>
        <h1 className="font-display text-2xl font-semibold mb-1">You&rsquo;re offline</h1>
        <p className="text-sm font-body text-white/70 max-w-xs mx-auto">
          No internet connection. Your visit notes will sync when you&rsquo;re back online.
        </p>
        {lastSync && (
          <p className="text-xs font-body text-white/40 mt-2">
            Last synced: {new Date(lastSync).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* Cached visits */}
      <div className="px-4 pb-8">
        {cachedVisits.length === 0 ? (
          <div className="bg-white/10 rounded-card p-6 text-center">
            <p className="text-sm font-body text-white/70 mb-1">No cached visits found</p>
            <p className="text-xs font-body text-white/40">Open Careroot while online to cache your schedule</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-body text-white/50 uppercase tracking-widest mb-3">
              Cached visits ({cachedVisits.length})
            </p>
            <div className="space-y-3">
              {cachedVisits.map(visit => (
                <Link
                  key={visit.id}
                  href={`/carer/visit/${visit.id}`}
                  className="block bg-white/10 hover:bg-white/15 transition-colors rounded-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User2 size={14} className="text-white/60 flex-shrink-0" />
                        <p className="text-sm font-body font-semibold text-white truncate">{visit.client_name}</p>
                        <span className={`text-xs font-body font-semibold px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${statusColor[visit.status] ?? "bg-white/20 text-white"}`}>
                          {visit.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={12} className="text-white/50" />
                        <p className="text-xs font-body text-white/60">
                          {new Date(visit.scheduled_start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          {" – "}
                          {new Date(visit.scheduled_end).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {visit.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-white/50" />
                          <p className="text-xs font-body text-white/50 truncate">{visit.address}</p>
                        </div>
                      )}
                    </div>
                    <ChevronRight size={18} className="text-white/40 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 bg-white/5 border border-white/10 rounded-card p-4 text-center">
          <p className="text-xs font-body text-white/50">
            Any notes or updates you record while offline will sync automatically when your connection is restored.
          </p>
        </div>
      </div>
    </div>
  );
}
