"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen bg-cr-cream flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-lg border border-red-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-700">
          <AlertTriangle size={22} />
        </div>
        <h1 className="font-display text-2xl text-cr-forest">Something needs attention</h1>
        <p className="mt-2 text-sm text-cr-slate/70">
          This dashboard section could not load. Your data has not been changed.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md bg-cr-forest px-4 py-2 text-sm font-semibold text-white"
          >
            <RefreshCw size={16} />
            Try again
          </button>
          <Link href="/dashboard" className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-cr-forest">
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
