"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";

type Client = { id: string; first_name: string; last_name: string };
type LineItem = {
  visit_id?: string; description: string; date: string;
  quantity: number; unit: string; unit_price: number; total: number;
};

const vatOptions = [0, 5, 20];

export default function NewInvoicePage() {
  const router = useRouter();
  const supabase = createClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [funderType, setFunderType] = useState("private");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [vatRate, setVatRate] = useState(0);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("users").select("organisation_id").eq("id", user.id).single().then(({ data }) => {
        setOrgId(data?.organisation_id ?? "");
        supabase.from("clients").select("id, first_name, last_name").eq("organisation_id", data?.organisation_id).eq("status", "active").then(({ data: c }) => setClients(c ?? []));
      });
    });
    const due = new Date(); due.setDate(due.getDate() + 30);
    setDueDate(due.toISOString().split("T")[0]);
  }, []);

  const generateFromVisits = async () => {
    if (!clientId || !periodStart || !periodEnd) return;
    setGenerating(true);
    const res = await fetch("/api/invoicing/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, period_start: periodStart, period_end: periodEnd, funder_type: funderType, organisation_id: orgId }),
    });
    const data = await res.json();
    if (data.line_items) setLineItems(data.line_items);
    setGenerating(false);
    setStep(2);
  };

  const addManualLine = () => {
    setLineItems([...lineItems, { description: "", date: issueDate, quantity: 1, unit: "hours", unit_price: 0, total: 0 }]);
  };

  const updateLine = (i: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    (updated[i] as Record<string, unknown>)[field] = value;
    updated[i].total = Number(updated[i].quantity) * Number(updated[i].unit_price);
    setLineItems(updated);
  };

  const removeLine = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));

  const subtotal = lineItems.reduce((s, l) => s + l.total, 0);
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  const save = async (send = false) => {
    setSaving(true);
    const invNum = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const { data: inv, error } = await supabase.from("invoices").insert({
      organisation_id: orgId, client_id: clientId, invoice_number: invNum,
      funder_type: funderType, status: "draft", issue_date: issueDate, due_date: dueDate,
      period_start: periodStart, period_end: periodEnd,
      subtotal, vat_rate: vatRate, vat_amount: vatAmount, total,
      amount_paid: 0, amount_outstanding: total, notes,
    }).select().single();
    if (!error && inv) {
      if (lineItems.length > 0) {
        await supabase.from("invoice_line_items").insert(lineItems.map((l) => ({ ...l, invoice_id: inv.id })));
      }
      router.push(`/invoicing/${inv.id}`);
    }
    setSaving(false);
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body text-cr-charcoal focus:outline-none focus:border-cr-forest transition-colors";

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/invoicing" className="text-cr-slate hover:text-cr-forest transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-body font-semibold text-xl text-cr-charcoal">Create Invoice</h1>
          <p className="text-sm text-cr-slate">Step {step} of 2</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-4 mb-8">
        {["Select client & period", "Review & create"].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${step > i + 1 ? "bg-cr-forest text-white" : step === i + 1 ? "bg-cr-forest text-white" : "bg-gray-200 text-gray-500"}`}>{i + 1}</div>
            <span className={`text-sm font-body ${step === i + 1 ? "text-cr-charcoal font-medium" : "text-cr-slate"}`}>{label}</span>
            {i < 1 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Client <span className="text-cr-red">*</span></label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls}>
              <option value="">Select a client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Period start <span className="text-cr-red">*</span></label>
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Period end <span className="text-cr-red">*</span></label>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1.5">Funder type</label>
            <select value={funderType} onChange={(e) => setFunderType(e.target.value)} className={inputCls}>
              <option value="private">Private</option>
              <option value="local_authority">Local Authority</option>
              <option value="nhs">NHS</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={generateFromVisits} disabled={!clientId || !periodStart || !periodEnd || generating}
              className="flex items-center gap-2 bg-cr-forest text-white px-5 py-2.5 rounded-lg text-sm font-body font-medium hover:bg-cr-sage transition-colors disabled:opacity-50">
              {generating ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : "Generate from visits"}
            </button>
            <button onClick={() => { setLineItems([]); setStep(2); }}
              className="px-5 py-2.5 rounded-lg text-sm font-body font-medium border border-gray-200 text-cr-charcoal hover:border-cr-forest transition-colors">
              Add manually
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {/* Line items */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-body font-semibold text-cr-charcoal">Line Items</h2>
              <button onClick={addManualLine} className="flex items-center gap-1.5 text-xs text-cr-forest hover:underline font-body font-medium"><Plus size={14} /> Add line</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="bg-cr-mint">
                  <tr>
                    {["Date", "Description", "Qty", "Unit", "Rate (£)", "Total (£)", ""].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lineItems.map((l, i) => (
                    <tr key={i}>
                      <td className="px-2 py-2"><input type="date" value={l.date} onChange={(e) => updateLine(i, "date", e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs w-32" /></td>
                      <td className="px-2 py-2"><input type="text" value={l.description} onChange={(e) => updateLine(i, "description", e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs w-48" /></td>
                      <td className="px-2 py-2"><input type="number" step="0.25" value={l.quantity} onChange={(e) => updateLine(i, "quantity", parseFloat(e.target.value) || 0)} className="border border-gray-200 rounded px-2 py-1 text-xs w-16" /></td>
                      <td className="px-2 py-2"><input type="text" value={l.unit} onChange={(e) => updateLine(i, "unit", e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs w-16" /></td>
                      <td className="px-2 py-2"><input type="number" step="0.01" value={l.unit_price} onChange={(e) => updateLine(i, "unit_price", parseFloat(e.target.value) || 0)} className="border border-gray-200 rounded px-2 py-1 text-xs w-20" /></td>
                      <td className="px-3 py-2 font-medium">£{l.total.toFixed(2)}</td>
                      <td className="px-2 py-2"><button onClick={() => removeLine(i)} className="text-cr-red hover:opacity-70"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {lineItems.length === 0 && <p className="text-center py-8 text-sm text-cr-slate">No line items. Add one above.</p>}
            </div>
          </div>

          {/* Totals + details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-body font-semibold text-cr-charcoal">Invoice Details</h2>
              <div>
                <label className="block text-xs font-body font-medium text-cr-slate mb-1">Issue date</label>
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-cr-slate mb-1">Due date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-cr-slate mb-1">VAT rate</label>
                <select value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} className={inputCls}>
                  {vatOptions.map((v) => <option key={v} value={v}>{v}%</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-cr-slate mb-1">Notes (optional)</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder="Payment terms, bank details, etc." />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-body font-semibold text-cr-charcoal mb-4">Totals</h2>
              <div className="space-y-2 text-sm font-body">
                <div className="flex justify-between text-cr-slate"><span>Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-cr-slate"><span>VAT ({vatRate}%)</span><span>£{vatAmount.toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold text-cr-charcoal text-base border-t border-gray-100 pt-2 mt-2"><span>Total</span><span>£{total.toFixed(2)}</span></div>
              </div>
              <div className="flex flex-col gap-3 mt-8">
                <button onClick={() => save(false)} disabled={saving || lineItems.length === 0}
                  className="w-full py-2.5 rounded-lg text-sm font-body font-medium border border-cr-forest text-cr-forest hover:bg-cr-mint transition-colors disabled:opacity-50">
                  {saving ? "Saving…" : "Save as Draft"}
                </button>
                <button onClick={() => save(true)} disabled={saving || lineItems.length === 0}
                  className="w-full py-2.5 rounded-lg text-sm font-body font-medium bg-cr-forest text-white hover:bg-cr-sage transition-colors disabled:opacity-50">
                  {saving ? <><Loader2 size={14} className="animate-spin inline mr-2" />Creating…</> : "Create Invoice"}
                </button>
              </div>
            </div>
          </div>

          <button onClick={() => setStep(1)} className="text-sm font-body text-cr-slate hover:text-cr-forest transition-colors">
            ← Back to step 1
          </button>
        </div>
      )}
    </div>
  );
}
