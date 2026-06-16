"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CRBadge } from "@/components/ui/CRBadge";

interface Props {
  flagId: string;
  status: string;
}

export function RiskFlagActions({ flagId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const update = async (newStatus: string) => {
    setLoading(true);
    await fetch("/api/ai/risk-flags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: flagId, status: newStatus }),
    });
    router.refresh();
    setLoading(false);
  };

  if (status === "resolved") {
    return <CRBadge variant="green" size="sm">Resolved</CRBadge>;
  }

  return (
    <div className="flex items-center gap-2">
      {status === "open" && (
        <button
          onClick={() => update("acknowledged")}
          disabled={loading}
          className="text-xs font-body px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors disabled:opacity-50"
        >
          Acknowledge
        </button>
      )}
      <button
        onClick={() => update("resolved")}
        disabled={loading}
        className="text-xs font-body px-2 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200 transition-colors disabled:opacity-50"
      >
        Resolve
      </button>
    </div>
  );
}
