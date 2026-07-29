"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { Clock, RefreshCw } from "lucide-react";
import { submitOrQueue } from "@/lib/offline-queue";
import { getOrCreateDeviceId } from "@/lib/device-id";

type Client = { id: string; first_name: string; last_name: string; date_of_birth?: string };
type Medication = {
  id: string;
  client_id: string;
  medication_name: string;
  dose: string;
  scheduled_times?: string[] | null;
  route?: string | null;
  is_controlled?: boolean | null;
  is_prn?: boolean | null;
  current_stock?: number | null;
};
type Administration = {
  id: string;
  medication_schedule_id: string;
  client_id: string;
  status: string;
  administered_at?: string | null;
  created_at?: string | null;
  outcome_notes?: string | null;
};

interface Props {
  clients: Client[];
  medications: Medication[];
  initialAdministrations: Administration[];
  activeShiftId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  administered: { label: "Given", color: "text-green-700", bg: "bg-green-100" },
  given: { label: "Given", color: "text-green-700", bg: "bg-green-100" },
  omitted: { label: "Omitted", color: "text-red-700", bg: "bg-red-100" },
  missed: { label: "Missed", color: "text-red-700", bg: "bg-red-100" },
  refused: { label: "Refused", color: "text-orange-700", bg: "bg-orange-100" },
  deferred: { label: "Deferred", color: "text-blue-700", bg: "bg-blue-100" },
  not_required: { label: "Not required", color: "text-gray-500", bg: "bg-gray-100" },
  not_due: { label: "Not due", color: "text-gray-500", bg: "bg-gray-100" },
};

const OUTCOMES = ["administered", "omitted", "refused", "not_required"];

export function CarerEmarClient({ clients, medications, initialAdministrations, activeShiftId }: Props) {
  const supabase = createClient();
  const [admins, setAdmins] = useState<Administration[]>(initialAdministrations);
  const [selectedClient, setSelectedClient] = useState<string>(clients[0]?.id ?? "");
  const [logging, setLogging] = useState<string | null>(null);
  const [logForm, setLogForm] = useState<{ status: string; notes: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    setLastSync(new Date());
  }, []);

  useEffect(() => {
    if (clients.length === 0) return;

    const channel = supabase
      .channel("emar_live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medication_records",
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clients, supabase]);

  const clientMeds = medications.filter(m => m.client_id === selectedClient);
  const todayAdmins = admins.filter(a => a.client_id === selectedClient);
  const adminMap = useMemo(
    () => Object.fromEntries(todayAdmins.map(a => [a.medication_schedule_id, a])),
    [todayAdmins]
  );

  const handleLog = async (medId: string) => {
    if (!logForm) return;
    setSaving(true);
    setError("");

    let gpsLat = null, gpsLng = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      gpsLat = pos.coords.latitude;
      gpsLng = pos.coords.longitude;
    } catch {
      // The API will return the correct access error when GPS is required.
    }

    const result = await submitOrQueue("/api/medication-records", {
      shift_id: activeShiftId,
      client_id: selectedClient,
      medication_schedule_id: medId,
      outcome: logForm.status,
      outcome_notes: logForm.notes,
      gps_lat: gpsLat,
      gps_lng: gpsLng,
      imei: getOrCreateDeviceId(),
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error || "Could not save medication record");
      return;
    }

    const createdAt = new Date().toISOString();
    setAdmins(prev => [
      {
        id: String(result.data?.record?.id ?? crypto.randomUUID()),
        medication_schedule_id: medId,
        client_id: selectedClient,
        status: logForm.status,
        administered_at: logForm.status === "administered" ? createdAt : null,
        created_at: createdAt,
        outcome_notes: logForm.notes,
      },
      ...prev.filter(a => a.medication_schedule_id !== medId),
    ]);
    setLastSync(new Date());
    setLogging(null);
    setLogForm(null);
  };

  const givenToday = todayAdmins.filter(a => ["administered", "given"].includes(a.status)).length;
  const totalDue = clientMeds.length;

  return (
    <div className="space-y-4">
      {clients.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {clients.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClient(c.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedClient === c.id ? "bg-cr-forest text-white" : "bg-white border border-gray-200 text-cr-slate"
              }`}
            >
              {c.first_name} {c.last_name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <CRCard className="!p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{givenToday}</p>
          <p className="text-xs text-cr-slate">Given today</p>
        </CRCard>
        <CRCard className="!p-3 text-center">
          <p className="text-2xl font-bold text-cr-charcoal">{Math.max(totalDue - givenToday, 0)}</p>
          <p className="text-xs text-cr-slate">Remaining</p>
        </CRCard>
        <CRCard className="!p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {todayAdmins.filter(a => ["missed", "omitted", "refused"].includes(a.status)).length}
          </p>
          <p className="text-xs text-cr-slate">Missed/Refused</p>
        </CRCard>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-cr-slate">
        <RefreshCw size={11} className="text-green-500" />
        Live · Last updated {lastSync ? lastSync.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-"}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

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
            const recordedAt = admin?.administered_at ?? admin?.created_at;

            return (
              <CRCard key={med.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-cr-charcoal text-sm">{med.medication_name}</p>
                      {med.is_controlled && (
                        <span className="text-[10px] bg-red-100 text-cr-red font-bold px-1.5 py-0.5 rounded-full">CD</span>
                      )}
                      {med.is_prn && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">PRN</span>
                      )}
                    </div>
                    <p className="text-xs text-cr-slate">
                      {med.dose}{med.route ? ` · ${med.route}` : ""}
                    </p>
                    {med.scheduled_times && med.scheduled_times.length > 0 && (
                      <p className="text-xs text-cr-slate">Due: {med.scheduled_times.map(t => t.slice(0, 5)).join(", ")}</p>
                    )}
                    {med.current_stock != null && (
                      <p className="text-xs text-cr-slate">Stock: {med.current_stock}</p>
                    )}
                    {admin && recordedAt && (
                      <p className="text-xs text-cr-slate mt-1">
                        {STATUS_CONFIG[admin.status]?.label ?? admin.status} at {new Date(recordedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}
                        {admin.outcome_notes && ` · ${admin.outcome_notes}`}
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

                {logging === med.id ? (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {OUTCOMES.map(s => (
                        <button
                          key={s}
                          onClick={() => setLogForm(f => ({ status: s, notes: f?.notes ?? "" }))}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold border capitalize transition-colors ${
                            logForm?.status === s
                              ? s === "administered"
                                ? "bg-green-100 border-green-400 text-green-700"
                                : s === "omitted" || s === "refused"
                                  ? "bg-red-100 border-cr-red text-cr-red"
                                  : "bg-blue-100 border-blue-400 text-blue-700"
                              : "border-gray-200 text-cr-slate"
                          }`}
                          type="button"
                        >
                          {s.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={logForm?.notes ?? ""}
                      onChange={e => setLogForm(f => ({ status: f?.status ?? "", notes: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLog(med.id)}
                        disabled={saving || !logForm?.status}
                        className="cr-btn-primary text-xs px-4 py-2 flex-1"
                        type="button"
                      >
                        {saving ? "Saving..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => { setLogging(null); setLogForm(null); }}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-xs text-cr-slate"
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setLogging(med.id); setLogForm({ status: "", notes: "" }); }}
                    className="mt-3 w-full py-2 border border-cr-forest/30 text-cr-forest rounded-lg text-xs font-medium hover:bg-cr-mint transition-colors"
                    type="button"
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
