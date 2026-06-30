"use client";

import { useState } from "react";
import { Loader2, Lock, AlertCircle, MapPin } from "lucide-react";

interface Props {
  shift: Record<string, unknown>;
  credential: Record<string, unknown> | null;
  onSuccess: () => void;
}

export function ShiftLoginScreen({ shift, credential, onSuccess }: Props) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "getting" | "got" | "denied">("idle");
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

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

    setLoading(true);
    setError("");

    const gpsData = await getGPS();

    const res = await fetch("/api/shifts/access/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shift.id,
        pin,
        token: credential.token,
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
          disabled={loading || pin.length !== 6 || noCredential}
          className="w-full py-4 bg-cr-forest text-white font-bold text-base rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : "Start Shift"}
        </button>

        <p className="text-center text-xs text-cr-slate mt-4">
          PIN was sent via SMS before your shift. Contact your manager if you haven&apos;t received it.
        </p>
      </div>
    </div>
  );
}
