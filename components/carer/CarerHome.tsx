"use client";

import Link from "next/link";
import { Clock, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";

type Shift = {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  status: string;
  client_ids: string[] | null;
  service_lines: { name: string } | null;
};

export function CarerHome({ shifts: rawShifts, user }: { shifts: unknown[]; user: Record<string, unknown> | null }) {
  const shifts = rawShifts as Shift[];
  const completed = shifts.filter(s => s.status === "completed").length;
  const active = shifts.find(s => s.status === "active");

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-cr-charcoal">Today&apos;s Shifts</span>
          <span className="text-xl font-bold text-cr-forest">{completed}/{shifts.length}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full">
          <div className="h-2 bg-cr-forest rounded-full transition-all" style={{ width: shifts.length > 0 ? `${(completed / shifts.length) * 100}%` : "0%" }} />
        </div>
        <p className="text-xs text-cr-slate mt-1.5">{shifts.length - completed} remaining</p>
      </div>

      {/* Active shift banner */}
      {active && (
        <Link href={`/carer/shift/${active.id}`}>
          <div className="bg-cr-forest text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
            <div>
              <p className="text-xs opacity-70 mb-0.5">Active Shift</p>
              <p className="font-semibold">
                {new Date(active.scheduled_start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                {" — "}
                {new Date(active.scheduled_end).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-xs opacity-70 mt-0.5">{active.service_lines?.name || "Shift in progress"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <ChevronRight size={20} />
            </div>
          </div>
        </Link>
      )}

      {/* Shift list */}
      <h2 className="font-semibold text-cr-charcoal text-base">Your Schedule</h2>

      {shifts.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="mx-auto mb-2 text-cr-forest opacity-40" size={40} />
          <p className="font-medium text-cr-charcoal">No shifts today</p>
          <p className="text-sm text-cr-slate">Check back tomorrow</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map(shift => {
            const isCompleted = shift.status === "completed";
            const isActive = shift.status === "active";
            const isMissed = shift.status === "missed";
            return (
              <Link key={shift.id} href={`/carer/shift/${shift.id}`}>
                <div className={`bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3 transition-all
                  ${isActive ? "border-cr-forest ring-2 ring-cr-forest/20" : "border-gray-100"}
                  ${isCompleted ? "opacity-60" : ""}
                `}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isCompleted ? "bg-green-50" : isActive ? "bg-cr-forest" : isMissed ? "bg-red-50" : "bg-gray-50"}`}>
                    {isCompleted
                      ? <CheckCircle size={20} className="text-green-500" />
                      : isMissed
                      ? <AlertCircle size={20} className="text-red-500" />
                      : <Clock size={20} className={isActive ? "text-white" : "text-cr-slate"} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-cr-charcoal">
                      {new Date(shift.scheduled_start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      {" — "}
                      {new Date(shift.scheduled_end).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-xs text-cr-slate">{shift.service_lines?.name || "Shift"}</p>
                    {shift.client_ids?.length ? (
                      <p className="text-xs text-cr-slate">{shift.client_ids.length} client{shift.client_ids.length > 1 ? "s" : ""}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                      ${isCompleted ? "bg-green-100 text-green-700"
                      : isActive ? "bg-cr-forest text-white"
                      : isMissed ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-500"}`}>
                      {isActive ? "LIVE" : shift.status.toUpperCase()}
                    </span>
                    <ChevronRight size={16} className="text-cr-slate" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
