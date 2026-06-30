"use client";

import { useState } from "react";
import { FileText, Pill, UtensilsCrossed, Heart, AlertTriangle, Shield, ArrowRightLeft, LogOut, Loader2 } from "lucide-react";
import { ShiftLogForm } from "./forms/ShiftLogForm";
import { MedicationForm } from "./forms/MedicationForm";
import { NutritionForm } from "./forms/NutritionForm";
import { MoodForm } from "./forms/MoodForm";
import { IncidentForm } from "./forms/IncidentForm";
import { SafeguardingForm } from "./forms/SafeguardingForm";
import { HandoverForm } from "./forms/HandoverForm";
import { TaskCompletionForm } from "./forms/TaskCompletionForm";

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

  const actions = [
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
    if (!confirm("End this shift?")) return;
    setEnding(true);
    await fetch("/api/shifts/access/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift_id: shift.id }),
    });
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
      {/* Shift header */}
      <div className="bg-cr-forest text-white rounded-2xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <span className="text-xs font-semibold opacity-80">SHIFT ACTIVE</span>
            </div>
            <p className="font-bold text-lg">
              {start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              {" — "}
              {end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
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
      </div>

      {/* Client info */}
      {primaryClient && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-cr-slate mb-1">Client{clients.length > 1 ? `s (${clients.length})` : ""}</p>
          <p className="font-bold text-cr-charcoal">{String(primaryClient.first_name)} {String(primaryClient.last_name)}</p>
          {primaryClient.dnr_status && (
            <div className="mt-2 px-3 py-1.5 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-xs font-bold text-red-700">⚠ DNR ORDER IN PLACE</p>
            </div>
          )}
          {primaryClient.risk_level && String(primaryClient.risk_level) !== "low" && (
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
