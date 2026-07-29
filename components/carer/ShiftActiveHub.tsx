"use client";

import { useEffect, useState } from "react";
import React from "react";
import { FileText, Pill, UtensilsCrossed, Heart, AlertTriangle, Shield, ArrowRightLeft, LogOut, Loader2, Smartphone } from "lucide-react";
import { ShiftLogForm } from "./forms/ShiftLogForm";
import { MedicationForm } from "./forms/MedicationForm";
import { NutritionForm } from "./forms/NutritionForm";
import { MoodForm } from "./forms/MoodForm";
import { IncidentForm } from "./forms/IncidentForm";
import { SafeguardingForm } from "./forms/SafeguardingForm";
import { HandoverForm } from "./forms/HandoverForm";
import { TaskCompletionForm } from "./forms/TaskCompletionForm";
import { OfflineSyncStatus } from "./OfflineSyncStatus";
import { getOrCreateDeviceId } from "@/lib/device-id";

type Screen =
  | "home"
  | "log"
  | "medication"
  | "nutrition"
  | "mood"
  | "incident"
  | "safeguarding"
  | "handover"
  | "tasks";

interface Props {
  shift: Record<string, unknown>;
  clients: Record<string, unknown>[];
  carePlans: Record<string, unknown>[];
  staffId: string;
}

export function ShiftActiveHub({ shift, clients, carePlans, staffId }: Props) {
  const [screen, setScreen] = useState<Screen>("home");
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState("");
  const [endWellbeing, setEndWellbeing] = useState("");
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  const actions: { id: string; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "log", label: "Shift Log", icon: <FileText size={22} />, color: "bg-blue-50 text-blue-700" },
    { id: "tasks", label: "Tasks", icon: <FileText size={22} />, color: "bg-indigo-50 text-indigo-700" },
    { id: "medication", label: "Medication", icon: <Pill size={22} />, color: "bg-purple-50 text-purple-700" },
    { id: "nutrition", label: "Nutrition", icon: <UtensilsCrossed size={22} />, color: "bg-orange-50 text-orange-700" },
    { id: "mood", label: "Mood", icon: <Heart size={22} />, color: "bg-pink-50 text-pink-700" },
    { id: "incident", label: "Incident", icon: <AlertTriangle size={22} />, color: "bg-red-50 text-red-700" },
    { id: "safeguarding", label: "Safeguarding", icon: <Shield size={22} />, color: "bg-amber-50 text-amber-700" },
    { id: "handover", label: "Handover", icon: <ArrowRightLeft size={22} />, color: "bg-teal-50 text-teal-700" },
  ];

  async function endShift() {
    if (!endWellbeing) {
      setEndError("Select your wellbeing status before ending this shift.");
      return;
    }
    if (!confirm("End this shift?")) return;
    setEnding(true);
    setEndError("");

    let gpsLat = null, gpsLng = null, gpsAccuracy = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      gpsLat = pos.coords.latitude;
      gpsLng = pos.coords.longitude;
      gpsAccuracy = pos.coords.accuracy;
    } catch { /* handled by server if GPS is required */ }

    const wellbeingRes = await fetch("/api/staff-wellbeing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: staffId,
        shift_id: shift.id,
        check_type: "shift_end",
        wellbeing_status: endWellbeing,
      }),
    });
    if (!wellbeingRes.ok) {
      const result = await wellbeingRes.json().catch(() => ({}));
      setEndError(result.error || "Could not save wellbeing check");
      setEnding(false);
      return;
    }

    const res = await fetch("/api/shifts/access/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shift.id,
        imei: getOrCreateDeviceId(),
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        gps_accuracy_metres: gpsAccuracy,
      }),
    });
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      setEndError(result.error || "Could not end shift");
      setEnding(false);
      return;
    }
    window.location.href = "/carer";
  }

  if (screen !== "home") {
    const formProps = { shift, clients, carePlans, staffId, onBack: () => setScreen("home") };
    return (
      <div>
        {screen === "log" && <ShiftLogForm {...formProps} />}
        {screen === "tasks" && <TaskCompletionForm {...formProps} />}
        {screen === "medication" && <MedicationForm {...formProps} />}
        {screen === "nutrition" && <NutritionForm {...formProps} />}
        {screen === "mood" && <MoodForm {...formProps} />}
        {screen === "incident" && <IncidentForm {...formProps} />}
        {screen === "safeguarding" && <SafeguardingForm {...formProps} />}
        {screen === "handover" && <HandoverForm {...formProps} />}
      </div>
    );
  }

  const start = new Date(shift.scheduled_start as string);
  const end = new Date(shift.scheduled_end as string);
  const primaryClient = clients[0] as Record<string, unknown> | undefined;

  return (
    <div className="space-y-4 pb-6">
      <OfflineSyncStatus />

      {deviceId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <Smartphone size={16} className="mt-0.5 flex-shrink-0 text-amber-700" />
            <div>
              <p className="text-xs font-bold text-amber-900">Careroot Device ID</p>
              <code className="mt-1 block break-all rounded-lg bg-white px-2 py-1 text-[11px] font-mono text-cr-charcoal">
                {deviceId}
              </code>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                If this device is blocked, send this ID to your manager so they can approve it once.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shift header */}
      <div className="bg-cr-forest text-white rounded-2xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <span className="text-xs font-semibold opacity-80">SHIFT ACTIVE</span>
            </div>
            <p className="font-bold text-lg">
              {start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}
              {" - "}
              {end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}
            </p>
          </div>
          <button
            onClick={endShift}
            disabled={ending}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            {ending ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={14} />}
            End Shift
          </button>
        </div>
        <div className="mt-4">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/70 mb-1">End-of-shift wellbeing</label>
          <select
            value={endWellbeing}
            onChange={(e) => setEndWellbeing(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option className="text-cr-charcoal" value="">Select status...</option>
            <option className="text-cr-charcoal" value="good">Good</option>
            <option className="text-cr-charcoal" value="tired">Tired</option>
            <option className="text-cr-charcoal" value="stressed">Stressed</option>
            <option className="text-cr-charcoal" value="distressed">Distressed</option>
            <option className="text-cr-charcoal" value="unwell">Unwell</option>
          </select>
        </div>
        {endError && <p className="mt-3 text-xs font-semibold text-red-100">{endError}</p>}
      </div>

      {/* Client info */}
      {primaryClient && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-cr-slate mb-1">Client{clients.length > 1 ? `s (${clients.length})` : ""}</p>
          <p className="font-bold text-cr-charcoal">{String(primaryClient.first_name)} {String(primaryClient.last_name)}</p>
          {Boolean(primaryClient.dnr_status) && (
            <div className="mt-2 px-3 py-1.5 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-xs font-bold text-red-700">⚠ DNR ORDER IN PLACE</p>
            </div>
          )}
          {Boolean(primaryClient.risk_level) && String(primaryClient.risk_level) !== "low" && (
            <p className="text-xs text-amber-600 mt-1 font-medium capitalize">Risk: {String(primaryClient.risk_level)}</p>
          )}
        </div>
      )}

      {/* Action grid */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => setScreen(action.id as Screen)}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-start gap-3 text-left active:scale-95 transition-transform"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
              {action.icon}
            </div>
            <span className="font-semibold text-sm text-cr-charcoal">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
