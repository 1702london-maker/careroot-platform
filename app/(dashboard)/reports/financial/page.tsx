"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const STATUS_COLOURS: Record<string, string> = {
  draft: "#6B7280", sent: "#3B82F6", paid: "#1A3C2E", overdue: "#DC2626", cancelled: "#9CA3AF", void: "#9CA3AF",
};
const PIE_COLOURS = ["#6B7280", "#3B82F6", "#1A3C2E", "#DC2626"];

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

export default function FinancialReportsPage() {
  const supabase = createClient();
  const [revenueData, setRevenueData] = useState<{ month: string; local_authority: number; nhs: number; private: number; total: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; count: number; value: number }[]>([]);
  const [ageingData, setAgeingData] = useState<{ band: string; count: number; value: number }[]>([]);
  const [outstanding, setOutstanding] = useState<{ client: string; invoice_number: string; issue_date: string; due_date: string; total: number; days: number }[]>([]);
  const [dateRange, setDateRange] = useState("year");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: u } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
      if (!u) return;

      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);

      const { data: invoices } = await supabase.from("invoices")
        .select("*, clients(first_name, last_name)")
        .eq("organisation_id", u.organisation_id)
        .gte("issue_date", start.toISOString().split("T")[0]);

      if (!invoices) return;

      // Revenue by month
      const monthMap: Record<string, { local_authority: number; nhs: number; private: number }> = {};
      invoices.forEach((inv) => {
        const d = new Date(inv.issue_date);
        const key = d.toLocaleString("en-GB", { month: "short", year: "2-digit" });
        if (!monthMap[key]) monthMap[key] = { local_authority: 0, nhs: 0, private: 0 };
        const ft = inv.funder_type as string;
        if (ft === "local_authority") monthMap[key].local_authority += Number(inv.total);
        else if (ft === "nhs") monthMap[key].nhs += Number(inv.total);
        else monthMap[key].private += Number(inv.total);
      });
      setRevenueData(Object.entries(monthMap).map(([month, d]) => ({ month, ...d, total: d.local_authority + d.nhs + d.private })));

      // Status distribution
      const statusMap: Record<string, { count: number; value: number }> = {};
      invoices.forEach((inv) => {
        if (!statusMap[inv.status]) statusMap[inv.status] = { count: 0, value: 0 };
        statusMap[inv.status].count++;
        statusMap[inv.status].value += Number(inv.total);
      });
      setStatusData(Object.entries(statusMap).map(([name, d]) => ({ name, ...d })));

      // Ageing + outstanding
      const today = new Date();
      const ageMap: Record<string, { count: number; value: number }> = {
        "0–30 days": { count: 0, value: 0 },
        "31–60 days": { count: 0, value: 0 },
        "61–90 days": { count: 0, value: 0 },
        "90+ days": { count: 0, value: 0 },
      };
      const outRows: typeof outstanding = [];

      invoices.filter((i) => ["sent", "overdue"].includes(i.status)).forEach((inv) => {
        const due = new Date(inv.due_date);
        const days = Math.floor((today.getTime() - due.getTime()) / 86400000);
        const band = days <= 30 ? "0–30 days" : days <= 60 ? "31–60 days" : days <= 90 ? "61–90 days" : "90+ days";
        ageMap[band].count++;
        ageMap[band].value += Number(inv.amount_outstanding);
        const client = inv.clients as { first_name: string; last_name: string } | null;
        outRows.push({ client: client ? `${client.first_name} ${client.last_name}` : "—", invoice_number: inv.invoice_number, issue_date: new Date(inv.issue_date).toLocaleDateString("en-GB"), due_date: new Date(inv.due_date).toLocaleDateString("en-GB"), total: Number(inv.amount_outstanding), days: Math.max(0, days) });
      });
      setAgeingData(Object.entries(ageMap).map(([band, d]) => ({ band, ...d })));
      setOutstanding(outRows);
    });
  }, [dateRange]);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-cr-charcoal">Financial Reports</h1>
          <p className="text-sm text-cr-slate font-body mt-0.5">Revenue, outstanding invoices, payment trends, and client profitability.</p>
        </div>
        <div className="flex gap-2">
          {[["month", "This month"], ["quarter", "Last 3 months"], ["year", "Last 12 months"]].map(([v, l]) => (
            <button key={v} onClick={() => setDateRange(v)} className={`text-xs font-body font-medium px-3 py-1.5 rounded-lg border transition-colors ${dateRange === v ? "bg-cr-forest text-white border-cr-forest" : "border-gray-200 text-cr-charcoal hover:border-cr-forest"}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Revenue Overview</h3>
            <p className="text-xs text-cr-slate mt-0.5">Monthly invoiced revenue by funder type</p>
          </div>
          <button onClick={() => exportCSV(revenueData, `careroot-revenue-overview-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "DM Sans" }} tickFormatter={(v) => `£${v}`} />
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} formatter={(v) => [`£${Number(v ?? 0).toFixed(2)}`, ""]} />
              <Legend wrapperStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Bar dataKey="local_authority" fill="#1A3C2E" name="Local Authority" stackId="a" />
              <Bar dataKey="nhs" fill="#4A7C5E" name="NHS" stackId="a" />
              <Bar dataKey="private" fill="#C9A84C" name="Private" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center bg-cr-mint/30 rounded-lg">
            <p className="text-sm text-cr-slate font-body">No invoices in this period. Create invoices to see revenue data.</p>
          </div>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-cr-mint"><tr>{["Month", "Local Authority", "NHS", "Private", "Total"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {revenueData.map((r) => <tr key={r.month}><td className="px-3 py-2.5 font-medium text-cr-charcoal">{r.month}</td><td className="px-3 py-2.5 text-cr-slate">£{r.local_authority.toFixed(2)}</td><td className="px-3 py-2.5 text-cr-slate">£{r.nhs.toFixed(2)}</td><td className="px-3 py-2.5 text-cr-slate">£{r.private.toFixed(2)}</td><td className="px-3 py-2.5 font-semibold text-cr-charcoal">£{r.total.toFixed(2)}</td></tr>)}
              {!revenueData.length && <tr><td colSpan={5} className="text-center py-8 text-cr-slate text-xs">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Status Summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Invoice Status Summary</h3>
            <p className="text-xs text-cr-slate mt-0.5">Breakdown by invoice status — count and value</p>
          </div>
          <button onClick={() => exportCSV(statusData, `careroot-invoice-status-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        <div className="flex items-center gap-8">
          <ResponsiveContainer width={220} height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                {statusData.map((d, i) => <Cell key={i} fill={STATUS_COLOURS[d.name] ?? PIE_COLOURS[i % PIE_COLOURS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} formatter={(v) => [`£${Number(v ?? 0).toFixed(2)}`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-cr-mint"><tr>{["Status", "Count", "Total Value"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {statusData.map((r) => <tr key={r.name}><td className="px-3 py-2.5"><span className="capitalize font-medium text-cr-charcoal" style={{ color: STATUS_COLOURS[r.name] }}>{r.name}</span></td><td className="px-3 py-2.5 text-cr-slate">{r.count}</td><td className="px-3 py-2.5 font-semibold text-cr-charcoal">£{r.value.toFixed(2)}</td></tr>)}
                {!statusData.length && <tr><td colSpan={3} className="text-center py-6 text-cr-slate text-xs">No invoices found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ageing Report */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Outstanding Invoices — Ageing Report</h3>
            <p className="text-xs text-cr-slate mt-0.5">Overdue and sent invoices grouped by days outstanding</p>
          </div>
          <button onClick={() => exportCSV(outstanding, `careroot-outstanding-invoices-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-5">
          {ageingData.map((d) => (
            <div key={d.band} className="bg-cr-mint rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-cr-charcoal">£{d.value.toFixed(0)}</p>
              <p className="text-xs text-cr-slate font-body mt-0.5">{d.band}</p>
              <p className="text-xs text-cr-forest font-body mt-0.5">{d.count} invoice{d.count !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-cr-mint"><tr>{["Client", "Invoice #", "Issued", "Due", "Outstanding", "Days"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {outstanding.map((r, i) => <tr key={i}><td className="px-3 py-2.5 font-medium text-cr-charcoal">{r.client}</td><td className="px-3 py-2.5 text-cr-slate font-mono text-xs">{r.invoice_number}</td><td className="px-3 py-2.5 text-cr-slate">{r.issue_date}</td><td className="px-3 py-2.5 text-cr-slate">{r.due_date}</td><td className="px-3 py-2.5 font-semibold text-cr-red">£{r.total.toFixed(2)}</td><td className="px-3 py-2.5"><span className={`text-xs font-semibold ${r.days > 90 ? "text-cr-red" : r.days > 30 ? "text-amber-600" : "text-cr-slate"}`}>{r.days}d</span></td></tr>)}
              {!outstanding.length && <tr><td colSpan={6} className="text-center py-8 text-cr-slate text-xs">No outstanding invoices. Great work!</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remaining reports placeholder */}
      {[
        { title: "Payment Performance", desc: "Average days to payment per client, with on-time payment percentage" },
        { title: "Revenue by Client", desc: "Top clients by total invoiced — hours, visits, and revenue generated" },
        { title: "Revenue by Carer", desc: "Revenue value delivered per carer based on completed visits" },
        { title: "Overdue Alert Report", desc: "All invoices past due date with contact details for chasing" },
        { title: "VAT Summary", desc: "Total net, VAT, and gross by funder type — exportable for your accountant" },
      ].map((r) => (
        <div key={r.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-body font-semibold text-cr-charcoal text-lg">{r.title}</h3>
              <p className="text-xs text-cr-slate mt-0.5">{r.desc}</p>
            </div>
            <button className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5 opacity-50"><Download size={12} /> Export</button>
          </div>
          <div className="h-40 flex items-center justify-center bg-cr-mint/30 rounded-lg">
            <p className="text-sm text-cr-slate font-body">Data populates as invoices are created and paid.</p>
          </div>
        </div>
      ))}
    </div>
  );
}
