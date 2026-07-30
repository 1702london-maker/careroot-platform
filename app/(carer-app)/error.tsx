"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function CarerAppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen bg-cr-cream flex items-center justify-center px-5">
      <section className="w-full max-w-sm rounded-lg border border-red-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-700">
          <AlertTriangle size={20} />
        </div>
        <h1 className="font-display text-xl text-cr-forest">Staff app paused</h1>
        <p className="mt-2 text-sm text-cr-slate/70">
          This screen could not load. Try again, or return home and continue from your active shift.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-cr-forest px-3 py-2 text-sm font-semibold text-white"
          >
            <RefreshCw size={15} />
            Retry
          </button>
          <Link href="/carer" className="rounded-md border border-gray-200 px-3 py-2 text-center text-sm font-semibold text-cr-forest">
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
