"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const STATUS_COLOURS: Record<string, string> = {
  draft: "#6B7280",
  sent: "#3B82F6",
  paid: "#1A3C2E",
  overdue: "#DC2626",
  cancelled: "#9CA3AF",
  void: "#9CA3AF",
};
const PIE_COLOURS = ["#6B7280", "#3B82F6", "#1A3C2E", "#DC2626", "#C9A84C"];

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function fmtGBP(value: unknown) {
  return `GBP ${Number(value ?? 0).toFixed(2)}`;
}

type RevenueRow = { month: string; local_authority: number; nhs: number; private: number; total: number };
type StatusRow = { name: string; count: number; value: number };
type AgeRow = { band: string; count: number; value: number };
type OutstandingRow = { client: string; invoice_number: string; issue_date: string; due_date: string; total: number; days: number };
type ClientRevenueRow = { client: string; invoices: number; paid: number; outstanding: number; total: number };
type PaymentRow = { client: string; paid_invoices: number; average_days_to_pay: number; on_time_percent: number };
type VatRow = { funder_type: string; net: number; vat: number; gross: number };

export default function FinancialReportsPage() {
  const supabase = createClient();
  const [revenueData, setRevenueData] = useState<RevenueRow[]>([]);
  const [statusData, setStatusData] = useState<StatusRow[]>([]);
  const [ageingData, setAgeingData] = useState<AgeRow[]>([]);
  const [outstanding, setOutstanding] = useState<OutstandingRow[]>([]);
  const [clientRevenue, setClientRevenue] = useState<ClientRevenueRow[]>([]);
  const [paymentPerformance, setPaymentPerformance] = useState<PaymentRow[]>([]);
  const [vatSummary, setVatSummary] = useState<VatRow[]>([]);
  const [dateRange, setDateRange] = useState("year");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: u } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
      if (!u) return;

      const start = new Date();
      if (dateRange === "month") start.setMonth(start.getMonth() - 1);
      else if (dateRange === "quarter") start.setMonth(start.getMonth() - 3);
      else start.setFullYear(start.getFullYear() - 1);

      const { data: invoices } = await supabase
        .from("invoices")
        .select("*, clients(first_name, last_name)")
        .eq("organisation_id", u.organisation_id)
        .gte("issue_date", start.toISOString().split("T")[0]);

      if (!invoices) return;

      const monthMap: Record<string, { local_authority: number; nhs: number; private: number }> = {};
      const statusMap: Record<string, { count: number; value: number }> = {};
      const ageMap: Record<string, { count: number; value: number }> = {
        "0-30 days": { count: 0, value: 0 },
        "31-60 days": { count: 0, value: 0 },
        "61-90 days": { count: 0, value: 0 },
        "90+ days": { count: 0, value: 0 },
      };
      const byClient: Record<string, { client: string; invoices: number; paid: number; outstanding: number; total: number; paidDays: number[]; onTime: number }> = {};
      const byVat: Record<string, VatRow> = {};
      const outRows: OutstandingRow[] = [];
      const today = new Date();

      invoices.forEach((inv) => {
        const issueDate = inv.issue_date ? new Date(inv.issue_date) : new Date(inv.created_at);
        const month = issueDate.toLocaleString("en-GB", { month: "short", year: "2-digit" });
        const funder = inv.funder_type ?? "private";
        const total = Number(inv.total ?? inv.total_amount ?? 0);

        monthMap[month] = monthMap[month] ?? { local_authority: 0, nhs: 0, private: 0 };
        if (funder === "local_authority") monthMap[month].local_authority += total;
        else if (funder === "nhs") monthMap[month].nhs += total;
        else monthMap[month].private += total;

        statusMap[inv.status] = statusMap[inv.status] ?? { count: 0, value: 0 };
        statusMap[inv.status].count++;
        statusMap[inv.status].value += total;

        const client = one(inv.clients as { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null);
        const clientName = client ? `${client.first_name} ${client.last_name}` : "Unknown client";
        byClient[clientName] = byClient[clientName] ?? { client: clientName, invoices: 0, paid: 0, outstanding: 0, total: 0, paidDays: [], onTime: 0 };
        byClient[clientName].invoices++;
        byClient[clientName].paid += Number(inv.amount_paid ?? 0);
        byClient[clientName].outstanding += Number(inv.amount_outstanding ?? 0);
        byClient[clientName].total += total;

        if (inv.paid_at) {
          const daysToPay = Math.max(0, Math.round((new Date(inv.paid_at).getTime() - issueDate.getTime()) / 86400000));
          byClient[clientName].paidDays.push(daysToPay);
          if (inv.due_date && new Date(inv.paid_at) <= new Date(inv.due_date)) byClient[clientName].onTime++;
        }

        byVat[funder] = byVat[funder] ?? { funder_type: funder, net: 0, vat: 0, gross: 0 };
        byVat[funder].net += Number(inv.subtotal ?? 0);
        byVat[funder].vat += Number(inv.vat_amount ?? 0);
        byVat[funder].gross += total;

        if (["sent", "overdue"].includes(inv.status)) {
          const due = new Date(inv.due_date);
          const days = Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));
          const band = days <= 30 ? "0-30 days" : days <= 60 ? "31-60 days" : days <= 90 ? "61-90 days" : "90+ days";
          ageMap[band].count++;
          ageMap[band].value += Number(inv.amount_outstanding ?? total);
          outRows.push({
            client: clientName,
            invoice_number: inv.invoice_number,
            issue_date: issueDate.toLocaleDateString("en-GB"),
            due_date: due.toLocaleDateString("en-GB"),
            total: Number(inv.amount_outstanding ?? total),
            days,
          });
        }
      });

      setRevenueData(Object.entries(monthMap).map(([month, d]) => ({ month, ...d, total: d.local_authority + d.nhs + d.private })));
      setStatusData(Object.entries(statusMap).map(([name, d]) => ({ name, ...d })));
      setAgeingData(Object.entries(ageMap).map(([band, d]) => ({ band, ...d })));
      setOutstanding(outRows);
      const clientRows = Object.values(byClient).sort((a, b) => b.total - a.total);
      setClientRevenue(clientRows.map(({ client, invoices, paid, outstanding, total }) => ({ client, invoices, paid, outstanding, total })));
      setPaymentPerformance(clientRows.filter((r) => r.paidDays.length > 0).map((r) => ({
        client: r.client,
        paid_invoices: r.paidDays.length,
        average_days_to_pay: Math.round(r.paidDays.reduce((sum, d) => sum + d, 0) / r.paidDays.length),
        on_time_percent: Math.round((r.onTime / r.paidDays.length) * 100),
      })));
      setVatSummary(Object.values(byVat));
    });
  }, [dateRange, supabase]);

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

      <ChartCard title="Revenue Overview" subtitle="Monthly invoiced revenue by funder type" data={revenueData} filename="careroot-revenue-overview">
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `GBP ${v}`} />
              <Tooltip formatter={(v) => [fmtGBP(v), ""]} />
              <Legend />
              <Bar dataKey="local_authority" fill="#1A3C2E" name="Local Authority" stackId="a" />
              <Bar dataKey="nhs" fill="#4A7C5E" name="NHS" stackId="a" />
              <Bar dataKey="private" fill="#C9A84C" name="Private" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </ChartCard>

      <ChartCard title="Invoice Status Summary" subtitle="Breakdown by invoice status - count and value" data={statusData} filename="careroot-invoice-status">
        <div className="flex items-center gap-8">
          <ResponsiveContainer width={220} height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                {statusData.map((d, i) => <Cell key={i} fill={STATUS_COLOURS[d.name] ?? PIE_COLOURS[i % PIE_COLOURS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [fmtGBP(v), ""]} />
            </PieChart>
          </ResponsiveContainer>
          <MiniTable rows={statusData} columns={["name", "count", "value"]} moneyColumns={["value"]} />
        </div>
      </ChartCard>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-body font-semibold text-cr-charcoal text-lg">Outstanding Invoices - Ageing Report</h3>
            <p className="text-xs text-cr-slate mt-0.5">Sent and overdue invoices grouped by days outstanding</p>
          </div>
          <button onClick={() => exportCSV(outstanding, `careroot-outstanding-invoices-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {ageingData.map((d) => (
            <div key={d.band} className="bg-cr-mint rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-cr-charcoal">{fmtGBP(d.value)}</p>
              <p className="text-xs text-cr-slate font-body mt-0.5">{d.band}</p>
              <p className="text-xs text-cr-forest font-body mt-0.5">{d.count} invoice{d.count !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>
        <MiniTable rows={outstanding} columns={["client", "invoice_number", "issue_date", "due_date", "total", "days"]} moneyColumns={["total"]} />
      </div>

      <TableReport title="Payment Performance" subtitle="Average days to payment per client, with on-time payment percentage" rows={paymentPerformance} filename="careroot-payment-performance" columns={["client", "paid_invoices", "average_days_to_pay", "on_time_percent"]} />
      <TableReport title="Revenue by Client" subtitle="Top clients by total invoiced and outstanding balance" rows={clientRevenue} filename="careroot-revenue-by-client" columns={["client", "invoices", "paid", "outstanding", "total"]} moneyColumns={["paid", "outstanding", "total"]} />
      <TableReport title="Overdue Alert Report" subtitle="Invoices currently sent or overdue and awaiting payment" rows={outstanding} filename="careroot-overdue-alerts" columns={["client", "invoice_number", "issue_date", "due_date", "total", "days"]} moneyColumns={["total"]} />
      <TableReport title="VAT Summary" subtitle="Total net, VAT and gross by funder type" rows={vatSummary} filename="careroot-vat-summary" columns={["funder_type", "net", "vat", "gross"]} moneyColumns={["net", "vat", "gross"]} />
    </div>
  );
}

function ChartCard({ title, subtitle, data, filename, children }: { title: string; subtitle: string; data: Record<string, unknown>[]; filename: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-body font-semibold text-cr-charcoal text-lg">{title}</h3>
          <p className="text-xs text-cr-slate mt-0.5">{subtitle}</p>
        </div>
        <button onClick={() => exportCSV(data, `${filename}-${new Date().toISOString().split("T")[0]}.csv`)} className="text-xs font-body font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cr-forest transition-colors flex items-center gap-1.5"><Download size={12} /> Export</button>
      </div>
      {children}
    </div>
  );
}

function TableReport({ title, subtitle, rows, columns, filename, moneyColumns = [] }: { title: string; subtitle: string; rows: Record<string, unknown>[]; columns: string[]; filename: string; moneyColumns?: string[] }) {
  return (
    <ChartCard title={title} subtitle={subtitle} data={rows} filename={filename}>
      <MiniTable rows={rows} columns={columns} moneyColumns={moneyColumns} />
    </ChartCard>
  );
}

function MiniTable({ rows, columns, moneyColumns = [] }: { rows: Record<string, unknown>[]; columns: string[]; moneyColumns?: string[] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-body">
        <thead className="bg-cr-mint"><tr>{columns.map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h.replace(/_/g, " ")}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, index) => (
            <tr key={index}>{columns.map((column) => <td key={column} className="px-3 py-2.5 text-cr-charcoal">{moneyColumns.includes(column) ? fmtGBP(row[column]) : String(row[column] ?? "")}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty() {
  return (
    <div className="h-40 flex items-center justify-center bg-cr-mint/30 rounded-lg">
      <p className="text-sm text-cr-slate font-body">No live records found for this report.</p>
    </div>
  );
}
