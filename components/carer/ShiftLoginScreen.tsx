"use client";

import { useState, useEffect } from "react";
import { Loader2, Lock, AlertCircle, MapPin, Copy, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  shift: Record<string, unknown>;
  credential: Record<string, unknown> | null;
  clients: Record<string, unknown>[];
  carePlans: Record<string, unknown>[];
  staffId: string;
  onSuccess: () => void;
}

export function ShiftLoginScreen({ shift, credential, clients, carePlans, staffId, onSuccess }: Props) {
  const supabase = createClient();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "getting" | "got" | "denied">("idle");
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const [copied, setCopied] = useState(false);
  const [carePlanConfirmed, setCarePlanConfirmed] = useState(carePlans.length === 0);

  // Generate or retrieve a stable browser device ID
  useEffect(() => {
    let id = localStorage.getItem("careroot_device_id");
    if (!id) {
      id = "WEB-" + Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      localStorage.setItem("careroot_device_id", id);
    }
    setDeviceId(id);
  }, []);

  function copyDeviceId() {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const scheduledStart = new Date(shift.scheduled_start as string);
  const scheduledEnd = new Date(shift.scheduled_end as string);
  const now = new Date();
  const credentialNotYetActive = credential && now < new Date(credential.valid_from as string);
  const noCredential = !credential;

  async function getGPS(): Promise<{ lat: number; lng: number; accuracy: number } | null> {
    setGpsStatus("getting");
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const g = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) };
          setGps(g);
          setGpsStatus("got");
          resolve(g);
        },
        () => { setGpsStatus("denied"); resolve(null); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  async function handleStart() {
    if (pin.length !== 6) { setError("Enter your 6-digit PIN"); return; }
    if (!credential) { setError("No credentials found. Ask your manager to send your PIN."); return; }
    if (carePlans.length > 0 && !carePlanConfirmed) {
      setError("Read and confirm the care plan before starting this shift.");
      return;
    }

    setLoading(true);
    setError("");

    if (carePlans.length > 0) {
      const rows = carePlans.map((plan) => ({
        care_plan_id: plan.id,
        client_id: plan.client_id,
        carer_id: staffId,
        viewed_at: new Date().toISOString(),
      }));
      const { error: viewError } = await supabase.from("care_plan_views").insert(rows);
      if (viewError) {
        setLoading(false);
        setError(viewError.message);
        return;
      }
    }

    const gpsData = await getGPS();

    const res = await fetch("/api/shifts/access/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shift.id,
        pin,
        token: credential.token,
        imei: deviceId,
        gps_lat: gpsData?.lat ?? null,
        gps_lng: gpsData?.lng ?? null,
        gps_accuracy_metres: gpsData?.accuracy ?? null,
      }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.reason || result.error || "Access denied");
    } else {
      onSuccess();
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-2">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cr-forest rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-cr-charcoal">Shift Access</h1>
          <p className="text-sm text-cr-slate mt-1">
            {scheduledStart.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            {" — "}
            {scheduledEnd.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Alerts */}
        {noCredential && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-sm text-amber-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>Your PIN hasn&apos;t been sent yet. Contact your manager.</span>
          </div>
        )}
        {credentialNotYetActive && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex gap-2 text-sm text-blue-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>Your PIN activates 30 minutes before shift start.</span>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* PIN input */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-4">
          <label className="block text-xs font-semibold text-cr-slate mb-2 uppercase tracking-wider">Enter PIN from SMS</label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="——  ——  ——"
            className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-cr-forest transition-colors"
          />
        </div>

        {carePlans.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
            <p className="text-xs font-semibold text-cr-slate uppercase tracking-wider mb-3">Care plan confirmation</p>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {carePlans.map((plan) => {
                const client = clients.find((c) => c.id === plan.client_id);
                const authorised = Array.isArray(plan.authorised_tasks) ? plan.authorised_tasks : [];
                const excluded = Array.isArray(plan.excluded_tasks) ? plan.excluded_tasks : [];
                return (
                  <div key={String(plan.id)} className="rounded-xl border border-gray-100 p-3 bg-gray-50">
                    <p className="text-sm font-semibold text-cr-charcoal">{String(client?.first_name ?? "")} {String(client?.last_name ?? "")}</p>
                    <p className="text-xs text-cr-slate mt-2">Authorised tasks</p>
                    <p className="text-xs text-cr-charcoal mt-0.5">{authorised.length ? authorised.join(", ") : "No authorised task list set."}</p>
                    {excluded.length > 0 && (
                      <>
                        <p className="text-xs text-red-700 mt-2">Do not perform</p>
                        <p className="text-xs text-cr-charcoal mt-0.5">{excluded.join(", ")}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <label className="mt-3 flex items-start gap-2 text-xs text-cr-charcoal">
              <input
                type="checkbox"
                checked={carePlanConfirmed}
                onChange={(e) => setCarePlanConfirmed(e.target.checked)}
                className="mt-0.5 accent-cr-forest"
              />
              <span>I have read the current care plan, authorised tasks, and excluded tasks for this shift.</span>
            </label>
          </div>
        )}

        {/* GPS status */}
        {gpsStatus === "getting" && (
          <div className="flex items-center gap-2 text-xs text-cr-slate mb-3 justify-center">
            <Loader2 size={12} className="animate-spin" /> Getting your location...
          </div>
        )}
        {gpsStatus === "got" && gps && (
          <div className="flex items-center gap-2 text-xs text-green-700 mb-3 justify-center">
            <MapPin size={12} /> Location captured (±{gps.accuracy}m)
          </div>
        )}
        {gpsStatus === "denied" && (
          <div className="flex items-center gap-2 text-xs text-amber-600 mb-3 justify-center">
            <AlertCircle size={12} /> Location access denied — shift will still start
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading || pin.length !== 6 || noCredential || (carePlans.length > 0 && !carePlanConfirmed)}
          className="w-full py-4 bg-cr-forest text-white font-bold text-base rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : "Start Shift"}
        </button>

        <p className="text-center text-xs text-cr-slate mt-4">
          PIN was sent via SMS before your shift. Contact your manager if you haven&apos;t received it.
        </p>

        {/* Device ID — shown so manager can register this browser as an approved device */}
        {deviceId && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-[10px] font-semibold text-cr-slate uppercase tracking-wider mb-1">Your Device ID</p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-cr-charcoal flex-1 break-all">{deviceId}</code>
              <button onClick={copyDeviceId} className="flex-shrink-0 text-cr-slate hover:text-cr-forest transition-colors">
                {copied ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[10px] text-cr-slate mt-1">Share this with your manager to register this device.</p>
          </div>
        )}
      </div>
    </div>
  );
}
