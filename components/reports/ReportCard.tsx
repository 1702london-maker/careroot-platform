"use client";

import { useState } from "react";
import { Download, ChevronDown, ChevronUp } from "lucide-react";

interface ReportCardProps {
  title: string;
  description: string;
  chart?: React.ReactNode;
  table?: React.ReactNode;
  onExport?: () => void;
}

export function ReportCard({ title, description, chart, table, onExport }: ReportCardProps) {
  const [tableOpen, setTableOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-body font-semibold text-lg text-cr-charcoal">{title}</h3>
          <p className="text-sm text-cr-slate mt-0.5">{description}</p>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 text-xs font-body font-medium text-cr-slate border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest hover:text-cr-forest transition-colors flex-shrink-0 ml-4"
          >
            <Download size={12} />
            Export CSV
          </button>
        )}
      </div>

      {chart && <div className="h-64 mb-4">{chart}</div>}

      {table && (
        <>
          <button
            onClick={() => setTableOpen(!tableOpen)}
            className="flex items-center gap-1.5 text-xs font-body font-medium text-cr-forest hover:underline mb-2"
          >
            {tableOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {tableOpen ? "Hide data table" : "View data table"}
          </button>
          {tableOpen && (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              {table}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h] ?? "";
        return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
      }).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
