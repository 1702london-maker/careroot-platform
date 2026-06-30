"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { Smartphone, Plus, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type Device = {
  id: string;
  imei: string;
  device_model: string | null;
  is_active: boolean;
  registered_at: string;
  deactivated_at: string | null;
  staff: { id: string; first_name: string; last_name: string; email: string } | null;
  registered_by_user: { first_name: string; last_name: string } | null;
};

type StaffMember = { id: string; first_name: string; last_name: string; email: string };

export default function DevicesPage() {
  const supabase = createClient();
  const [devices, setDevices] = useState<Device[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ staff_id: "", imei: "", device_model: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data: devicesData } = await supabase
      .from("registered_devices")
      .select(`id, imei, device_model, is_active, registered_at, deactivated_at,
        staff:users!staff_id(id, first_name, last_name, email),
        registered_by_user:users!registered_by(first_name, last_name)`)
      .order("registered_at", { ascending: false });

    const { data: staffData } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .eq("role", "carer")
      .order("first_name");

    setDevices((devicesData as unknown as Device[]) || []);
    setStaff(staffData || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/devices/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();

    if (!res.ok) {
      setError(result.error || "Failed to register device");
    } else {
      setSuccess("Device registered successfully");
      setForm({ staff_id: "", imei: "", device_model: "" });
      setShowForm(false);
      load();
    }
    setSubmitting(false);
  }

  async function handleDeactivate(device_id: string, staffName: string) {
    if (!confirm(`Deactivate device for ${staffName}? They will not be able to log in until a new device is registered.`)) return;
    const res = await fetch("/api/devices/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id }),
    });
    if (res.ok) { setSuccess("Device deactivated"); load(); }
    else { const r = await res.json(); setError(r.error || "Failed to deactivate"); }
  }

  const active = devices.filter(d => d.is_active);
  const inactive = devices.filter(d => !d.is_active);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <CRPageHeader
        title="Device Registration"
        subtitle="Manage staff IMEI device registrations. Staff can only log in from their registered device."
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-cr-forest text-white rounded-lg text-sm font-semibold hover:bg-cr-sage transition-colors"
          >
            <Plus size={16} /> Register Device
          </button>
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-cr-charcoal">Register New Device</h3>
            <button onClick={() => setShowForm(false)} className="text-cr-slate hover:text-cr-charcoal"><X size={18} /></button>
          </div>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cr-charcoal mb-1">Staff Member</label>
              <select
                required
                value={form.staff_id}
                onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest"
              >
                <option value="">Select staff member</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cr-charcoal mb-1">IMEI Number</label>
              <input
                required
                type="text"
                value={form.imei}
                onChange={e => setForm(f => ({ ...f, imei: e.target.value }))}
                placeholder="e.g. 352099001761481"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest"
              />
              <p className="mt-1 text-xs text-cr-slate">Staff can find their IMEI by dialling *#06# on their phone.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-cr-charcoal mb-1">Device Model <span className="text-cr-slate font-normal">(optional)</span></label>
              <input
                type="text"
                value={form.device_model}
                onChange={e => setForm(f => ({ ...f, device_model: e.target.value }))}
                placeholder="e.g. Samsung Galaxy A54"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-cr-forest text-white rounded-lg text-sm font-semibold hover:bg-cr-sage transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? "Registering..." : "Register Device"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-cr-slate" /></div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-cr-charcoal mb-3">Active Devices ({active.length})</h3>
            {active.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-cr-slate">No active devices registered.</div>
            ) : (
              <div className="space-y-2">
                {active.map(device => (
                  <div key={device.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-cr-mint flex items-center justify-center flex-shrink-0">
                        <Smartphone size={18} className="text-cr-forest" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-cr-charcoal">
                          {device.staff ? `${device.staff.first_name} ${device.staff.last_name}` : "Unknown"}
                        </p>
                        <p className="text-xs text-cr-slate">IMEI: {device.imei}{device.device_model ? ` · ${device.device_model}` : ""}</p>
                        <p className="text-xs text-cr-slate">
                          Registered {new Date(device.registered_at).toLocaleDateString("en-GB")}
                          {device.registered_by_user ? ` by ${device.registered_by_user.first_name} ${device.registered_by_user.last_name}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeactivate(device.id, device.staff ? `${device.staff.first_name} ${device.staff.last_name}` : "this staff member")}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      Deactivate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {inactive.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-cr-charcoal mb-3">Deactivated Devices ({inactive.length})</h3>
              <div className="space-y-2">
                {inactive.map(device => (
                  <div key={device.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3 opacity-60">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Smartphone size={18} className="text-cr-slate" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-cr-charcoal">
                        {device.staff ? `${device.staff.first_name} ${device.staff.last_name}` : "Unknown"}
                      </p>
                      <p className="text-xs text-cr-slate">IMEI: {device.imei}{device.device_model ? ` · ${device.device_model}` : ""}</p>
                      <p className="text-xs text-cr-slate">
                        Deactivated {device.deactivated_at ? new Date(device.deactivated_at).toLocaleDateString("en-GB") : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
