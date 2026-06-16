import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Send, CheckCircle, AlertCircle } from "lucide-react";
import type { Invoice } from "@/types";

function fmtGBP(n: number) {
  return `£${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
  const orgId = userRecord?.organisation_id;

  const { data: inv } = await supabase
    .from("invoices")
    .select("*, clients(first_name, last_name, address), invoice_line_items(*)")
    .eq("id", params.id)
    .eq("organisation_id", orgId)
    .single();

  if (!inv) notFound();

  const invoice = inv as Invoice & {
    clients: { first_name: string; last_name: string; address: Record<string, string> } | null;
    invoice_line_items: Invoice["line_items"];
  };

  const statusBanner: Record<string, { bg: string; text: string; message: string }> = {
    draft:   { bg: "bg-amber-50 border-amber-200",   text: "text-amber-700",  message: "This invoice is a draft — not yet sent to the client." },
    sent:    { bg: "bg-blue-50 border-blue-200",      text: "text-blue-700",   message: `Invoice sent on ${invoice.sent_at ? new Date(invoice.sent_at).toLocaleDateString("en-GB") : "—"}.` },
    paid:    { bg: "bg-cr-mint border-cr-sage/30",    text: "text-cr-forest",  message: `Paid in full on ${invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString("en-GB") : "—"}.` },
    overdue: { bg: "bg-red-50 border-red-200",        text: "text-cr-red",     message: `Payment overdue — due ${new Date(invoice.due_date).toLocaleDateString("en-GB")}.` },
  };
  const banner = statusBanner[invoice.status];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/invoicing" className="text-cr-slate hover:text-cr-forest"><ArrowLeft size={20} /></Link>
          <h1 className="font-body font-semibold text-xl text-cr-charcoal">{invoice.invoice_number}</h1>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/invoicing/${invoice.id}/pdf`} className="flex items-center gap-1.5 text-sm font-body font-medium border border-gray-200 text-cr-charcoal rounded-lg px-3 py-2 hover:border-cr-forest transition-colors">
            <Download size={15} /> PDF
          </a>
          {invoice.status === "draft" && (
            <Link href={`/api/invoicing/${invoice.id}/send`} className="flex items-center gap-1.5 text-sm font-body font-medium bg-cr-forest text-white rounded-lg px-3 py-2 hover:bg-cr-sage transition-colors">
              <Send size={15} /> Send Invoice
            </Link>
          )}
        </div>
      </div>

      {banner && (
        <div className={`flex items-center gap-3 border rounded-xl px-5 py-3.5 mb-6 ${banner.bg}`}>
          {invoice.status === "paid" ? <CheckCircle size={18} className={banner.text} /> : <AlertCircle size={18} className={banner.text} />}
          <p className={`text-sm font-body font-medium ${banner.text}`}>{banner.message}</p>
        </div>
      )}

      {/* Invoice document */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="font-display text-2xl font-semibold text-cr-charcoal mb-1">Careroot Ltd</p>
            <p className="text-sm text-cr-slate font-body">careroot.care · onboarding@careroot.co.uk</p>
          </div>
          <div className="text-right">
            <p className="font-body font-bold text-2xl text-cr-charcoal">{invoice.invoice_number}</p>
            <p className="text-sm text-cr-slate font-body mt-1">Issued: {new Date(invoice.issue_date).toLocaleDateString("en-GB")}</p>
            <p className="text-sm text-cr-slate font-body">Due: {new Date(invoice.due_date).toLocaleDateString("en-GB")}</p>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs font-body font-semibold uppercase tracking-widest text-cr-slate mb-2">Bill To</p>
          {invoice.clients && (
            <p className="font-body font-semibold text-cr-charcoal">{invoice.clients.first_name} {invoice.clients.last_name}</p>
          )}
          <p className="text-sm text-cr-slate font-body capitalize">{invoice.funder_type?.replace("_", " ")}</p>
          <p className="text-sm text-cr-slate font-body">Period: {new Date(invoice.period_start).toLocaleDateString("en-GB")} — {new Date(invoice.period_end).toLocaleDateString("en-GB")}</p>
        </div>

        <table className="w-full text-sm font-body mb-8">
          <thead className="bg-cr-mint">
            <tr>
              {["Date", "Description", "Qty", "Unit", "Rate", "Total"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(invoice.invoice_line_items ?? []).map((l, i) => (
              <tr key={l.id} className={i % 2 === 0 ? "" : "bg-gray-50/40"}>
                <td className="px-4 py-3 text-cr-slate">{new Date(l.date).toLocaleDateString("en-GB")}</td>
                <td className="px-4 py-3 text-cr-charcoal">{l.description}</td>
                <td className="px-4 py-3 text-cr-slate">{l.quantity}</td>
                <td className="px-4 py-3 text-cr-slate">{l.unit}</td>
                <td className="px-4 py-3 text-cr-slate">{fmtGBP(l.unit_price)}</td>
                <td className="px-4 py-3 font-medium text-cr-charcoal">{fmtGBP(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm font-body">
            <div className="flex justify-between text-cr-slate"><span>Subtotal</span><span>{fmtGBP(invoice.subtotal)}</span></div>
            <div className="flex justify-between text-cr-slate"><span>VAT ({invoice.vat_rate}%)</span><span>{fmtGBP(invoice.vat_amount)}</span></div>
            <div className="flex justify-between font-bold text-cr-charcoal text-base border-t border-gray-100 pt-2"><span>Total</span><span>{fmtGBP(invoice.total)}</span></div>
            {invoice.amount_paid > 0 && (
              <>
                <div className="flex justify-between text-cr-forest"><span>Amount paid</span><span>{fmtGBP(invoice.amount_paid)}</span></div>
                <div className="flex justify-between font-bold text-cr-charcoal border-t border-gray-100 pt-2"><span>Balance outstanding</span><span>{fmtGBP(invoice.amount_outstanding)}</span></div>
              </>
            )}
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs font-body font-semibold uppercase tracking-widest text-cr-slate mb-2">Notes</p>
            <p className="text-sm font-body text-cr-slate">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
