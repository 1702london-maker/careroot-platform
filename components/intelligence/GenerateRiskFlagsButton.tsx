"use client";

import { useState } from "react";
import { CRButton } from "@/components/ui/CRButton";
import { Sparkles } from "lucide-react";

export function GenerateRiskFlagsButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/generate-risk-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(`${data.count} risk flag${data.count === 1 ? "" : "s"} generated`);
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <CRButton onClick={generate} loading={loading} size="sm" variant="secondary">
        <Sparkles size={14} className="mr-1.5" />
        Analyse Risk
      </CRButton>
      {result && <p className="text-sm font-body text-cr-slate">{result}</p>}
    </div>
  );
}
