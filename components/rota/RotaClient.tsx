"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Clock, User2 } from "lucide-react";
import { CRBadge } from "@/components/ui/CRBadge";

type StaffMember = { id: string; first_name: string; last_name: string; role: string };
type Client = { id: string; first_name: string; last_name: string };
type ServiceLine = { id: string; name: string };
type Shift = {
  id: string;
  staff_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  client?: { first_name: string; last_name: string } | null;
  client_ids?: string[] | null;
  service_lines?: { name: string } | null;
};

type Props = {
  initialShifts: Shift[];
  staff: StaffMember[];
  clients: Client[];
  serviceLines: ServiceLine[];
  weekStart: string; // ISO date of Monday
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function mondayOf(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

const statusVariant = (s: string): "green" | "amber" | "red" | "forest" | "slate" => {
  if (s === "completed") return "green";
  if (s === "in_progress") return "forest";
  if (s === "missed") return "red";
  if (s === "cancelled") return "red";
  return "slate";
};

const STAFF_COLOURS = [
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-amber-100 border-amber-300 text-amber-800",
  "bg-pink-100 border-pink-300 text-pink-800",
  "bg-teal-100 border-teal-300 text-teal-800",
  "bg-indigo-100 border-indigo-300 text-indigo-800",
  "bg-orange-100 border-orange-300 text-orange-800",
];

export function RotaClient({ initialShifts, staff, clients, serviceLines, weekStart: initialWeekStart }: Props) {
  const [weekStart, setWeekStart] = useState(() => new Date(initialWeekStart));
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ staffId: string; date: string } | null>(null);
  const [form, setForm] = useState({ client_id: "", service_line_id: "", start_time: "09:00", end_time: "17:00" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const staffColour = (staffId: string) => {
    const idx = staff.findIndex((s) => s.id === staffId) % STAFF_COLOURS.length;
    return STAFF_COLOURS[idx] ?? STAFF_COLOURS[0];
  };

  const navigate = async (direction: 1 | -1) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + direction * 7);
    setWeekStart(next);
    setLoading(true);
    try {
      const from = next.toISOString();
      const to = addDays(next, 6);
      to.setHours(23, 59, 59, 999);
      const res = await fetch(`/api/rota/shifts?from=${from}&to=${to.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setShifts(data.shifts ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  const openModal = (staffId: string, date: string) => {
    setForm({ client_id: "", service_line_id: "", start_time: "09:00", end_time: "17:00" });
    setFormError("");
    setModal({ staffId, date });
  };

  const createShift = async () => {
    if (!form.client_id) { setFormError("Select a client"); return; }
    setSubmitting(true);
    setFormError("");
    const scheduled_start = `${modal!.date}T${form.start_time}:00`;
    const scheduled_end = `${modal!.date}T${form.end_time}:00`;
    const res = await fetch("/api/rota/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: modal!.staffId,
        client_id: form.client_id,
        service_line_id: form.service_line_id || null,
        scheduled_start,
        scheduled_end,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error ?? "Failed to create shift"); setSubmitting(false); return; }
    setShifts((prev) => [...prev, data.shift]);
    setModal(null);
    setSubmitting(false);
  };

  const weekLabel = `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(weekStart, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  const isCurrentWeek = isoDate(mondayOf(today)) === isoDate(weekStart);

  return (
    <div>
      {/* Week nav */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-body font-semibold text-cr-charcoal min-w-[200px] text-center">{weekLabel}</span>
          <button onClick={() => navigate(1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <ChevronRight size={16} />
          </button>
          {!isCurrentWeek && (
            <button
              onClick={() => { setWeekStart(mondayOf(today)); navigate(0 as 1); }}
              className="text-xs font-body text-cr-forest hover:underline ml-1"
            >
              Today
            </button>
          )}
        </div>
        {loading && <Loader2 size={16} className="animate-spin text-cr-slate" />}
        <div className="flex items-center gap-1 flex-wrap">
          {staff.slice(0, 5).map((s, i) => (
            <span key={s.id} className={`text-xs font-body px-2 py-0.5 rounded-full border ${STAFF_COLOURS[i % STAFF_COLOURS.length]}`}>
              {s.first_name}
            </span>
          ))}
        </div>
      </div>

      {/* Grid: staff rows × day columns */}
      {staff.length === 0 ? (
        <div className="text-center py-16 text-cr-slate font-body text-sm">No staff found. Invite carers from the Staff page first.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-body font-semibold text-cr-slate uppercase tracking-wide w-32 bg-gray-50">
                  Staff
                </th>
                {DAYS.map((day, i) => {
                  const d = addDays(weekStart, i);
                  const isToday = isoDate(d) === isoDate(today);
                  return (
                    <th key={day} className={`px-2 py-3 text-center text-xs font-body font-semibold uppercase tracking-wide min-w-[100px] ${isToday ? "bg-cr-forest text-white" : "bg-gray-50 text-cr-slate"}`}>
                      <span className="block">{day}</span>
                      <span className={`text-base font-display ${isToday ? "text-white" : "text-cr-charcoal"}`}>{d.getDate()}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-body font-semibold ${staffColour(member.id)}`}>
                        {member.first_name[0]}{member.last_name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-body font-semibold text-cr-charcoal leading-tight">{member.first_name}</p>
                        <p className="text-[10px] text-cr-slate capitalize">{member.role}</p>
                      </div>
                    </div>
                  </td>
                  {DAYS.map((_, i) => {
                    const d = addDays(weekStart, i);
                    const dateStr = isoDate(d);
                    const dayShifts = shifts.filter((s) => s.staff_id === member.id && s.scheduled_start.slice(0, 10) === dateStr);
                    return (
                      <td key={i} className="px-1.5 py-1.5 align-top border-l border-gray-50 min-h-[80px]">
                        <div className="space-y-1 min-h-[60px]">
                          {dayShifts.map((shift) => {
                            const client = shift.client;
                            return (
                              <div key={shift.id} className={`rounded-md border px-2 py-1.5 text-xs ${staffColour(member.id)}`}>
                                <p className="font-body font-semibold leading-tight truncate">
                                  {client ? `${client.first_name} ${client.last_name}` : "—"}
                                </p>
                                <p className="text-[10px] opacity-75 flex items-center gap-0.5 mt-0.5">
                                  <Clock size={9} />
                                  {fmt(shift.scheduled_start)}–{fmt(shift.scheduled_end)}
                                </p>
                                <CRBadge variant={statusVariant(shift.status)} size="sm" className="mt-1">
                                  {shift.status}
                                </CRBadge>
                              </div>
                            );
                          })}
                          <button
                            onClick={() => openModal(member.id, dateStr)}
                            className="w-full flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-body text-cr-slate hover:text-cr-forest hover:bg-cr-mint transition-colors border border-dashed border-gray-200 hover:border-cr-forest"
                          >
                            <Plus size={10} /> Add
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary row */}
      {shifts.length > 0 && (
        <div className="mt-3 flex items-center gap-6 text-xs font-body text-cr-slate">
          <span><strong className="text-cr-charcoal">{shifts.length}</strong> shifts this week</span>
          <span><strong className="text-cr-charcoal">{shifts.filter(s => s.status === "completed").length}</strong> completed</span>
          <span><strong className="text-cr-charcoal">{shifts.filter(s => s.status === "missed").length}</strong> missed</span>
        </div>
      )}

      {/* Create shift modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-semibold text-lg text-cr-charcoal">Add Shift</h2>
                <p className="text-xs text-cr-slate font-body mt-0.5">
                  {staff.find(s => s.id === modal.staffId)?.first_name} {staff.find(s => s.id === modal.staffId)?.last_name} · {new Date(modal.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-cr-slate hover:text-cr-charcoal"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Client *</label>
                <select
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest bg-white"
                >
                  <option value="">Select client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              </div>

              {serviceLines.length > 0 && (
                <div>
                  <label className="block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Service line</label>
                  <select
                    value={form.service_line_id}
                    onChange={(e) => setForm({ ...form, service_line_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest bg-white"
                  >
                    <option value="">None</option>
                    {serviceLines.map((sl) => (
                      <option key={sl.id} value={sl.id}>{sl.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Start time</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">End time</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-cr-forest"
                  />
                </div>
              </div>

              {formError && <p className="text-xs text-red-600 font-body">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={createShift}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-cr-forest text-white py-2.5 rounded-lg text-sm font-body font-medium hover:bg-cr-sage transition-colors disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {submitting ? "Creating…" : "Create shift"}
                </button>
                <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-body text-cr-slate hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
