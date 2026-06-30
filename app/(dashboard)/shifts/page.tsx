"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { Clock, CheckCircle, AlertCircle, Loader2, Send, MapPin, Smartphone } from "lucide-react";

type Shift = {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: string;
  staff: { id: string; first_name: string; last_name: string; phone: string | null } | null;
  service_lines: { name: string } | null;
};

type AccessLog = {
  id: string;
  action_type: string;
  server_timestamp: string;
  gps_lat: number | null;
  gps_lng: number | null;
  within_approved_radius: boolean | null;
  device_imei: string | null;
};

export default function ShiftsPage() {
  const supabase = createClient();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, { type: "ok" | "err"; text: string }>>({});
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [accessLog, setAccessLog] = useState<AccessLog[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 2);

    const { data } = await supabase
      .from("shifts")
      .select(`id, scheduled_start, scheduled_end, actual_start, actual_end, status,
        staff:users!staff_id(id, first_name, last_name, phone),
        service_lines(name)`)
      .gte("scheduled_start", today.toISOString())
      .lte("scheduled_start", tomorrow.toISOString())
      .order("scheduled_start");

    setShifts((data as unknown as Shift[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function sendCredentials(shift_id: string) {
    setSendingId(shift_id);
    const res = await fetch("/api/shifts/credentials/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift_id }),
    });
    const result = await res.json();
    setSendingId(null);

    if (!res.ok) {
      setMessages(m => ({ ...m, [shift_id]: { type: "err", text: result.error || "Failed" } }));
    } else {
      setMessages(m => ({
        ...m,
        [shift_id]: {
          type: "ok",
          text: result.sms_sent ? `PIN sent to ${result.staff_name}` : `Generated but SMS failed — check Twilio`,
        },
      }));
    }
  }

  async function loadAccessLog(shift_id: string) {
    setSelectedShift(shift_id);
    setLogLoading(true);
    const { data } = await supabase
      .from("shift_access_log")
      .select("id, action_type, server_timestamp, gps_lat, gps_lng, within_approved_radius, device_imei")
      .eq("shift_id", shift_id)
      .order("server_timestamp", { ascending: false });
    setAccessLog(data || []);
    setLogLoading(false);
  }

  const statusColor: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-500",
    missed: "bg-red-100 text-red-700",
  };

  const actionLabel: Record<string, string> = {
    shift_start: "Shift started",
    shift_end: "Shift ended",
    auto_logout: "Auto logout",
    auto_logout_credential_expired: "Auto logout (credentials expired)",
    gps_ping: "GPS ping",
    access_denied_bad_credential: "Access denied — bad credentials",
    access_denied_wrong_pin: "Access denied — wrong PIN",
    access_denied_unregistered_device: "Access denied — unregistered device",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <CRPageHeader
        title="Shifts"
        subtitle="Today and tomorrow's shifts. Send PIN credentials to staff before their shift."
      />

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-cr-slate" /></div>
      ) : shifts.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-sm text-cr-slate">
          No shifts scheduled for today or tomorrow.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            {shifts.map(shift => {
              const msg = messages[shift.id];
              const isSelected = selectedShift === shift.id;
              return (
                <div
                  key={shift.id}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${isSelected ? "border-cr-forest shadow-sm" : "border-gray-100 hover:border-gray-200"}`}
                  onClick={() => loadAccessLog(shift.id)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-sm text-cr-charcoal">
                        {shift.staff ? `${shift.staff.first_name} ${shift.staff.last_name}` : "Unassigned"}
                      </p>
                      <p className="text-xs text-cr-slate mt-0.5">
                        {new Date(shift.scheduled_start).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {" — "}
                        {new Date(shift.scheduled_end).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {shift.service_lines && <p className="text-xs text-cr-slate">{shift.service_lines.name}</p>}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${statusColor[shift.status] || "bg-gray-100 text-gray-500"}`}>
                      {shift.status}
                    </span>
                  </div>

                  {shift.staff && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); sendCredentials(shift.id); }}
                        disabled={sendingId === shift.id || shift.status === "completed"}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cr-forest text-white rounded-lg hover:bg-cr-sage transition-colors disabled:opacity-50"
                      >
                        {sendingId === shift.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        {sendingId === shift.id ? "Sending..." : "Send PIN"}
                      </button>
                      {!shift.staff.phone && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle size={12} /> No phone number
                        </span>
                      )}
                    </div>
                  )}

                  {msg && (
                    <div className={`mt-2 flex items-center gap-1.5 text-xs ${msg.type === "ok" ? "text-green-700" : "text-red-600"}`}>
                      {msg.type === "ok" ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {msg.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Access Log Panel */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            {!selectedShift ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center text-sm text-cr-slate">
                <Clock size={28} className="mb-2 opacity-40" />
                <p>Click a shift to view its access log</p>
              </div>
            ) : logLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-cr-slate" /></div>
            ) : (
              <>
                <h3 className="font-semibold text-sm text-cr-charcoal mb-3">Access Log</h3>
                {accessLog.length === 0 ? (
                  <p className="text-xs text-cr-slate py-8 text-center">No access events yet for this shift.</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {accessLog.map(log => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-cr-charcoal">
                            {actionLabel[log.action_type] || log.action_type}
                          </p>
                          <span className="text-[10px] text-cr-slate flex-shrink-0">
                            {new Date(log.server_timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {log.gps_lat != null && (
                            <span className={`flex items-center gap-1 text-[10px] font-medium ${log.within_approved_radius === true ? "text-green-600" : log.within_approved_radius === false ? "text-red-600" : "text-cr-slate"}`}>
                              <MapPin size={10} />
                              {log.within_approved_radius === true ? "Within radius" : log.within_approved_radius === false ? "Outside radius" : `${log.gps_lat?.toFixed(4)}, ${log.gps_lng?.toFixed(4)}`}
                            </span>
                          )}
                          {log.device_imei && (
                            <span className="flex items-center gap-1 text-[10px] text-cr-slate">
                              <Smartphone size={10} />
                              {log.device_imei.slice(-6)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
