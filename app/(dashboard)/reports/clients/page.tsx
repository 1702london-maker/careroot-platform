"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download } from "lucide-react";

type ReportRow = Record<string, string | number>;
type ReportSection = { title: string; desc: string; rows: ReportRow[] };
type ClientRow = { id: string; first_name: string; last_name: string; risk_level: string | null; onboarding_complete: boolean | null };

function exportCSV(data: ReportRow[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

function DataSection({ section }: { section: ReportSection }) {
  const headers = Object.keys(section.rows[0] ?? { status: "" });
  return (
    <div className="mb-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-body text-lg font-semibold text-cr-charcoal">{section.title}</h3>
          <p className="mt-0.5 text-xs text-cr-slate">{section.desc}</p>
        </div>
        <button
          onClick={() => exportCSV(section.rows, `careroot-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 font-body text-xs font-medium transition-colors hover:border-cr-forest"
        >
          <Download size={12} /> Export
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-cr-mint">
            <tr>{headers.map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-cr-slate">{h.replace(/_/g, " ")}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {section.rows.map((row, i) => <tr key={i}>{headers.map((h) => <td key={h} className="px-3 py-2.5 text-cr-charcoal">{String(row[h] ?? "")}</td>)}</tr>)}
            {!section.rows.length && <tr><td colSpan={headers.length} className="py-6 text-center text-xs text-cr-slate">No data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ClientReportsPage() {
  const supabase = createClient();
  const [sections, setSections] = useState<ReportSection[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: u } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
      if (!u) return;

      const since = new Date(Date.now() - 30 * 24 * 3600000).toISOString();

      // Fetch clients first so their IDs can scope tables without org_id columns
      const { data: clients } = await supabase
        .from("clients")
        .select("id, first_name, last_name, risk_level, onboarding_complete")
        .eq("organisation_id", u.organisation_id)
        .neq("status", "deceased")
        .neq("status", "inactive");

      const orgClientIds = (clients ?? []).map((c) => c.id);

      const [{ data: visits }, { data: meds }, { data: nutrition }, { data: carePlans }, { data: incidents }] = await Promise.all([
        supabase.from("visits").select("client_id, status, scheduled_start").eq("organisation_id", u.organisation_id).gte("scheduled_start", since),
        orgClientIds.length > 0
          ? supabase.from("medication_records").select("client_id, status, created_at").in("client_id", orgClientIds).gte("created_at", since)
          : Promise.resolve({ data: [] }),
        orgClientIds.length > 0
          ? supabase.from("nutrition_records").select("client_id, consumed, concerns, server_timestamp").in("client_id", orgClientIds).gte("server_timestamp", since)
          : Promise.resolve({ data: [] }),
        supabase.from("care_plans").select("client_id, status, review_date, updated_at").eq("organisation_id", u.organisation_id),
        supabase.from("incidents").select("client_id, severity, status, reported_at").eq("organisation_id", u.organisation_id).gte("reported_at", since),
      ]);

      const clientRows = (clients ?? []) as ClientRow[];
      const visitRows = (visits ?? []) as Array<{ client_id: string | null; status: string | null }>;
      const medicationRows = (meds ?? []) as Array<{ client_id: string | null; status: string | null }>;
      const nutritionRows = (nutrition ?? []) as Array<{ client_id: string | null; consumed: string | null; concerns: string | null }>;
      const carePlanRows = (carePlans ?? []) as Array<{ client_id: string | null; status: string | null; review_date: string | null }>;
      const incidentRows = (incidents ?? []) as Array<{ client_id: string | null; severity: string | null; status: string | null }>;
      const name = (id: string) => {
        const c = clientRows.find((client) => client.id === id);
        return c ? `${c.first_name} ${c.last_name}`.trim() : "Unknown client";
      };
      const clientIds = new Set(clientRows.map((c) => c.id));
      const countByClient = <T extends { client_id: string | null }>(rows: T[] | null | undefined, predicate?: (row: T) => boolean) => {
        const counts: Record<string, number> = {};
        (rows ?? []).forEach((row) => {
          if (!row.client_id || !clientIds.has(row.client_id) || (predicate && !predicate(row))) return;
          counts[row.client_id] = (counts[row.client_id] ?? 0) + 1;
        });
        return counts;
      };

      const scheduled = countByClient(visitRows);
      const completed = countByClient(visitRows, (row) => row.status === "completed");
      const medTotal = countByClient(medicationRows);
      const medGiven = countByClient(medicationRows, (row) => ["given", "administered", "taken"].includes(String(row.status)));
      const nutritionConcerns = countByClient(nutritionRows, (row) => Boolean(row.concerns) || ["little", "none"].includes(String(row.consumed)));
      const incidentCounts = countByClient(incidentRows);
      const emergencyCounts = countByClient(incidentRows, (row) => ["critical", "high", "emergency"].includes(String(row.severity).toLowerCase()));

      setSections([
        {
          title: "Client Risk Overview",
          desc: "All active clients by current risk level and care plan state.",
          rows: clientRows.map((c) => ({ client: name(c.id), risk_level: c.risk_level ?? "low", care_plan: c.onboarding_complete ? "active" : "draft" })),
        },
        {
          title: "Visit Frequency",
          desc: "Scheduled vs completed visits per client over the last 30 days.",
          rows: clientRows.map((c) => ({ client: name(c.id), scheduled: scheduled[c.id] ?? 0, completed: completed[c.id] ?? 0, adherence: scheduled[c.id] ? `${Math.round(((completed[c.id] ?? 0) / scheduled[c.id]) * 100)}%` : "0%" })),
        },
        {
          title: "Medication Adherence",
          desc: "Per-client medication compliance over the last 30 days.",
          rows: clientRows.map((c) => ({ client: name(c.id), medication_records: medTotal[c.id] ?? 0, given: medGiven[c.id] ?? 0, adherence: medTotal[c.id] ? `${Math.round(((medGiven[c.id] ?? 0) / medTotal[c.id]) * 100)}%` : "No records" })),
        },
        {
          title: "Appetite and Nutrition",
          desc: "Clients with nutrition or appetite concerns flagged by carers.",
          rows: clientRows.map((c) => ({ client: name(c.id), concern_count: nutritionConcerns[c.id] ?? 0, status: (nutritionConcerns[c.id] ?? 0) > 0 ? "review" : "no concern logged" })),
        },
        {
          title: "Care Plan Review Status",
          desc: "Plans due or overdue for review.",
          rows: carePlanRows.filter((p) => p.client_id && clientIds.has(p.client_id)).map((p) => ({ client: name(p.client_id as string), status: p.status ?? "draft", review_date: p.review_date ? new Date(p.review_date).toLocaleDateString("en-GB") : "Not set" })),
        },
        {
          title: "Incident Summary",
          desc: "Incidents per client over the last 30 days.",
          rows: clientRows.map((c) => ({ client: name(c.id), incidents: incidentCounts[c.id] ?? 0 })),
        },
        {
          title: "Emergency Events",
          desc: "Emergency events by client over the last 30 days.",
          rows: clientRows.map((c) => ({ client: name(c.id), emergency_events: emergencyCounts[c.id] ?? 0 })),
        },
      ]);
    });
  }, []);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-cr-charcoal">Client Reports</h1>
        <p className="mt-0.5 font-body text-sm text-cr-slate">Care plans, risk, medication adherence, nutrition, incidents, and emergency events.</p>
      </div>
      {sections.map((section) => <DataSection key={section.title} section={section} />)}
    </div>
  );
}
