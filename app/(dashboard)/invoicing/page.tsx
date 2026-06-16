import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRStatCard } from "@/components/ui/CRStatCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { TrendingUp, Clock, AlertCircle, CheckCircle, Plus, Eye, Download } from "lucide-react";
import { formatDateUK } from "@/lib/utils";
import type { Invoice } from "@/types";

function fmtGBP(n: number) {
  return `£${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function statusBadge(status: Invoice["status"]) {
  const map: Record<Invoice["status"], { label: string; className: string }> = {
    draft:     { label: "Draft",     className: "bg-gray-100 text-gray-600" },
    sent:      { label: "Sent",      className: "bg-blue-100 text-blue-600" },
    paid:      { label: "Paid",      className: "bg-cr-mint text-cr-forest" },
    overdue:   { label: "Overdue",   className: "bg-red-100 text-cr-red" },
    cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500" },
    void:      { label: "Void",      className: "bg-gray-100 text-gray-400" },
  };
  const s = map[status] ?? map.draft;
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-body font-semibold ${s.className}`}>{s.label}</span>;
}

export default async function InvoicingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users").select("organisation_id, role").eq("id", user.id).single();
  const orgId = userRecord?.organisation_id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, clients(first_name, last_name)")
    .eq("organisation_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  const allInvoices = (invoices ?? []) as (Invoice & { clients: { first_name: string; last_name: string } | null })[];

  const invoicedThisMonth = allInvoices
    .filter((i) => i.issue_date >= monthStart && i.issue_date <= monthEnd)
    .reduce((s, i) => s + Number(i.total), 0);

  const outstanding = allInvoices
    .filter((i) => ["sent", "overdue"].includes(i.status))
    .reduce((s, i) => s + Number(i.amount_outstanding), 0);

  const overdueCount = allInvoices.filter((i) => i.status === "overdue").length;

  const paidThisMonth = allInvoices
    .filter((i) => i.status === "paid" && i.paid_at && i.paid_at >= monthStart)
    .reduce((s, i) => s + Number(i.amount_paid), 0);

  return (
    <div>
      <CRPageHeader
        title="Invoicing"
        subtitle="Manage client billing and track payments"
        action={
          <Link href="/invoicing/new" className="flex items-center gap-2 bg-cr-forest text-white px-4 py-2 rounded-lg text-sm font-body font-medium hover:bg-cr-sage transition-colors">
            <Plus size={16} /> Create Invoice
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <CRStatCard label="Invoiced This Month" value={fmtGBP(invoicedThisMonth)} icon={<TrendingUp size={20} />} />
        <CRStatCard label="Outstanding" value={fmtGBP(outstanding)} icon={<Clock size={20} />} variant={outstanding > 0 ? "warning" : "default"} />
        <CRStatCard label="Overdue" value={String(overdueCount)} icon={<AlertCircle size={20} />} variant={overdueCount > 0 ? "danger" : "default"} />
        <CRStatCard label="Paid This Month" value={fmtGBP(paidThisMonth)} icon={<CheckCircle size={20} />} variant="success" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-body font-semibold text-cr-charcoal">All Invoices</h2>
          <Link href="/invoicing/settings" className="text-xs font-body text-cr-slate hover:text-cr-forest transition-colors">
            Billing Settings
          </Link>
        </div>

        {allInvoices.length === 0 ? (
          <div className="text-center py-16 text-cr-slate font-body text-sm">
            <p className="mb-4">No invoices yet.</p>
            <Link href="/invoicing/new" className="bg-cr-forest text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cr-sage transition-colors">
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-cr-mint">
                <tr>
                  {["Invoice #", "Client", "Period", "Funder", "Amount", "Status", "Due Date", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allInvoices.map((inv, i) => (
                  <tr key={inv.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-3 font-medium text-cr-charcoal">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-cr-charcoal">
                      {inv.clients ? `${inv.clients.first_name} ${inv.clients.last_name}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-cr-slate text-xs">
                      {inv.period_start} — {inv.period_end}
                    </td>
                    <td className="px-4 py-3 text-cr-slate capitalize">{inv.funder_type?.replace("_", " ") ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-cr-charcoal">{fmtGBP(inv.total)}</td>
                    <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                    <td className="px-4 py-3 text-cr-slate">{inv.due_date ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/invoicing/${inv.id}`} className="p-1.5 rounded hover:bg-cr-mint transition-colors text-cr-forest" title="View">
                          <Eye size={14} />
                        </Link>
                        <a href={`/api/invoicing/${inv.id}/pdf`} className="p-1.5 rounded hover:bg-cr-mint transition-colors text-cr-forest" title="Download PDF">
                          <Download size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
