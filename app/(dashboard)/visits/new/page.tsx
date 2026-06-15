"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Client { id: string; first_name: string; last_name: string; }
interface Staff { id: string; first_name: string; last_name: string; }

export default function NewVisitPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    client_id: "",
    carer_id: "",
    date: "",
    start_time: "",
    end_time: "",
    visit_type: "personal_care",
    notes: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: userRecord } = await supabase
        .from("users").select("organisation_id").eq("id", user.id).single();
      const orgId = userRecord?.organisation_id;

      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from("clients").select("id, first_name, last_name")
          .eq("organisation_id", orgId).eq("status", "active").order("last_name"),
        supabase.from("users").select("id, first_name, last_name")
          .eq("organisation_id", orgId).eq("role", "carer").order("last_name"),
      ]);
      setClients(c || []);
      setStaff(s || []);
    }
    load();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.carer_id || !form.date || !form.start_time || !form.end_time) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userRecord } = await supabase
        .from("users").select("organisation_id").eq("id", user!.id).single();

      const scheduledStart = new Date(`${form.date}T${form.start_time}`).toISOString();
      const scheduledEnd = new Date(`${form.date}T${form.end_time}`).toISOString();

      const { error: insertError } = await supabase.from("visits").insert({
        organisation_id: userRecord?.organisation_id,
        client_id: form.client_id,
        carer_id: form.carer_id,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        visit_type: form.visit_type,
        notes: form.notes || null,
        status: "scheduled",
      });

      if (insertError) throw insertError;
      router.push("/visits");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to schedule visit. Please try again.");
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body text-cr-charcoal focus:outline-none focus:ring-2 focus:ring-cr-forest focus:border-transparent bg-white";
  const labelClass = "block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5";

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/visits" className="text-cr-slate hover:text-cr-charcoal transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-cr-charcoal">Schedule a Visit</h1>
          <p className="text-sm font-body text-cr-slate">Add a new care visit to the rota</p>
        </div>
      </div>

      <CRCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-cr-red font-body">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Client <span className="text-cr-red">*</span></label>
            <select
              className={inputClass}
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              required
            >
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Carer <span className="text-cr-red">*</span></label>
            <select
              className={inputClass}
              value={form.carer_id}
              onChange={(e) => setForm({ ...form, carer_id: e.target.value })}
              required
            >
              <option value="">Select a carer…</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Date <span className="text-cr-red">*</span></label>
            <input
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Time <span className="text-cr-red">*</span></label>
              <input
                type="time"
                className={inputClass}
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>End Time <span className="text-cr-red">*</span></label>
              <input
                type="time"
                className={inputClass}
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Visit Type <span className="text-cr-red">*</span></label>
            <select
              className={inputClass}
              value={form.visit_type}
              onChange={(e) => setForm({ ...form, visit_type: e.target.value })}
              required
            >
              <option value="personal_care">Personal Care</option>
              <option value="medication">Medication</option>
              <option value="social">Social</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any special instructions or care notes…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 cr-btn-primary py-2.5 text-sm font-body font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Scheduling…" : "Schedule Visit"}
            </button>
            <Link
              href="/visits"
              className="px-4 py-2.5 text-sm font-body font-medium text-cr-charcoal border border-gray-200 rounded-lg hover:bg-cr-mint transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </CRCard>
    </div>
  );
}
