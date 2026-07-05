"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";

type Client = { id: string; first_name: string; last_name: string; date_of_birth?: string };
type Medication = {
  id: string; client_id: string; name: string; dosage: string;
  frequency: string; time_to_take?: string; route?: string;
  specific_rules?: string; is_controlled?: boolean;
};
type Administration = {
  id: string; medication_id: string; client_id: string;
  status: string; administered_at: string; notes?: string;
  administered_by_name?: string;
};

interface Props {
  clients: Client[];
  medications: Medication[];
  initialAdministrations: Administration[];
  staffId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  given: { label: "Given", color: "text-green-700", bg: "bg-green-100" },
  missed: { label: "Missed", color: "text-red-700", bg: "bg-red-100" },
  refused: { label: "Refused", color: "text-orange-700", bg: "bg-orange-100" },
  deferred: { label: "Deferred", color: "text-blue-700", bg: "bg-blue-100" },
  not_due: { label: "Not due", color: "text-gray-500", bg: "bg-gray-100" },
};

export function CarerEmarClient({ clients, medications, initialAdministrations, staffId }: Props) {
  const supabase = createClient();
  const [admins, setAdmins] = useState<Administration[]>(initialAdministrations);
  const [selectedClient, setSelectedClient] = useState<string>(clients[0]?.id ?? "");
  const [logging, setLogging] = useState<string | null>(null);
  const [logForm, setLogForm] = useState<{ status: string; notes: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Set lastSync client-side only to avoid hydration mismatch
  useEffect(() => { setLastSync(new Date()); }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("emar_live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medication_administration",
          filter: `client_id=in.(${clients.map(c => c.id).join(",")})`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAdmins(prev => [payload.new as Administration, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setAdmins(prev => prev.map(a => a.id === payload.new.id ? payload.new as Administration : a));
          }
          setLastSync(new Date());
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clients]);

  const clientMeds = medications.filter(m => m.client_id === selectedClient);

  // Today's administration records for this client
  const todayAdmins = admins.filter(a => a.client_id === selectedClient);
  const adminMap = Object.fromEntries(todayAdmins.map(a => [a.medication_id, a]));

  const handleLog = async (medId: string) => {
    if (!logForm) return;
    setSaving(true);

    const existing = adminMap[medId];
    if (existing) {
      await supabase.from("medication_administration").update({
        status: logForm.status,
        notes: logForm.notes,
        administered_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("medication_administration").insert({
        medication_id: medId,
        client_id: selectedClient,
        administered_by: staffId,
        status: logForm.status,
        notes: logForm.notes,
        administered_at: new Date().toISOString(),
      });
    }

    setSaving(false);
    setLogging(null);
    setLogForm(null);
  };

  const givenToday = todayAdmins.filter(a => a.status === "given").length;
  const totalDue = clientMeds.length;

  return (
    <div className="space-y-4">
      {/* Client selector */}
      {clients.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {clients.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClient(c.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedClient === c.id
                  ? "bg-cr-forest text-white"
                  : "bg-white border border-gray-200 text-cr-slate"
              }`}
            >
              {c.first_name} {c.last_name}
            </button>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <CRCard className="!p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{givenToday}</p>
          <p className="text-xs text-cr-slate">Given today</p>
        </CRCard>
        <CRCard className="!p-3 text-center">
          <p className="text-2xl font-bold text-cr-charcoal">{totalDue - givenToday}</p>
          <p className="text-xs text-cr-slate">Remaining</p>
        </CRCard>
        <CRCard className="!p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {todayAdmins.filter(a => ["missed", "refused"].includes(a.status)).length}
          </p>
          <p className="text-xs text-cr-slate">Missed/Refused</p>
        </CRCard>
      </div>

      {/* Live sync indicator */}
      <div className="flex items-center gap-1.5 text-xs text-cr-slate">
        <RefreshCw size={11} className="text-green-500" />
        Live · Last updated {lastSync ? lastSync.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
      </div>

      {/* Medication cards */}
      {clientMeds.length === 0 ? (
        <CRCard>
          <div className="text-center py-8">
            <p className="text-sm text-cr-slate">No active medications for this client</p>
          </div>
        </CRCard>
      ) : (
        <div className="space-y-3">
          {clientMeds.map(med => {
            const admin = adminMap[med.id];
            const status = admin?.status ?? "pending";

            return (
              <CRCard key={med.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-cr-charcoal text-sm">{med.name}</p>
                      {med.is_controlled && (
                        <span className="text-[10px] bg-red-100 text-cr-red font-bold px-1.5 py-0.5 rounded-full">CD</span>
                      )}
                    </div>
                    <p className="text-xs text-cr-slate">{med.dosage} · {med.frequency}</p>
                    {med.time_to_take && <p className="text-xs text-cr-slate">Due: {med.time_to_take}</p>}
                    {med.route && <p className="text-xs text-cr-slate capitalize">Route: {med.route}</p>}
                    {med.specific_rules && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mt-1">{med.specific_rules}</p>
                    )}
                    {admin && (
                      <p className="text-xs text-cr-slate mt-1">
                        {STATUS_CONFIG[admin.status]?.label ?? admin.status} at {new Date(admin.administered_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        {admin.notes && ` · ${admin.notes}`}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {admin ? (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CONFIG[admin.status]?.bg ?? "bg-gray-100"} ${STATUS_CONFIG[admin.status]?.color ?? "text-gray-600"}`}>
                        {STATUS_CONFIG[admin.status]?.label ?? admin.status}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                        <Clock size={11} /> Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Log button */}
                {logging === med.id ? (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {["given", "missed", "refused", "deferred"].map(s => (
                        <button
                          key={s}
                          onClick={() => setLogForm(f => ({ ...f!, status: s }))}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold border capitalize transition-colors
                            ${logForm?.status === s
                              ? s === "given" ? "bg-green-100 border-green-400 text-green-700"
                                : s === "missed" || s === "refused" ? "bg-red-100 border-cr-red text-cr-red"
                                : "bg-blue-100 border-blue-400 text-blue-700"
                              : "border-gray-200 text-cr-slate"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={logForm?.notes ?? ""}
                      onChange={e => setLogForm(f => ({ ...f!, notes: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLog(med.id)}
                        disabled={saving || !logForm?.status}
                        className="cr-btn-primary text-xs px-4 py-2 flex-1"
                      >
                        {saving ? "Saving..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => { setLogging(null); setLogForm(null); }}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-xs text-cr-slate"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setLogging(med.id); setLogForm({ status: "", notes: "" }); }}
                    className="mt-3 w-full py-2 border border-cr-forest/30 text-cr-forest rounded-lg text-xs font-medium hover:bg-cr-mint transition-colors"
                  >
                    {admin ? "Update record" : "Log administration"}
                  </button>
                )}
              </CRCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
