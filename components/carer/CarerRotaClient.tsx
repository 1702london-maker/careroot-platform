"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, XCircle, Calendar } from "lucide-react";
import { CRCard } from "@/components/ui/CRCard";
import Link from "next/link";

type Shift = {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: string;
  client_ids?: string[];
};
type User = { id: string; first_name: string; last_name: string; contract_hours?: number } | null;

interface Props {
  shifts: Shift[];
  user: User;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekKey(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d.toISOString().slice(0, 10);
}

function groupByWeek(shifts: Shift[]) {
  const weeks = new Map<string, Shift[]>();
  for (const shift of shifts) {
    const key = getWeekKey(new Date(shift.scheduled_start));
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(shift);
  }
  return weeks;
}

function hoursInShift(shift: Shift) {
  const ms = new Date(shift.scheduled_end).getTime() - new Date(shift.scheduled_start).getTime();
  return ms / 3600000;
}

function statusIcon(status: string) {
  if (status === "completed") return <CheckCircle size={14} className="text-green-500" />;
  if (status === "missed") return <XCircle size={14} className="text-cr-red" />;
  if (status === "active") return <span className="w-2.5 h-2.5 rounded-full bg-cr-forest animate-pulse block" />;
  return <Clock size={14} className="text-cr-slate" />;
}

export function CarerRotaClient({ shifts, user }: Props) {
  const weeks = groupByWeek(shifts);
  const weekEntries = Array.from(weeks.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Current week stats — computed client-side only to avoid hydration mismatch
  const [hoursThisWeek, setHoursThisWeek] = useState(0);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [currentWeekShifts, setCurrentWeekShifts] = useState<Shift[]>([]);
  const [currentWeekKey, setCurrentWeekKey] = useState("");
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    const now = new Date();
    const wk = getWeekKey(now);
    const cwShifts = weeks.get(wk) ?? [];
    setCurrentWeekKey(wk);
    setCurrentWeekShifts(cwShifts);
    setHoursThisWeek(cwShifts.reduce((sum, s) => sum + hoursInShift(s), 0));
    setCompletedThisWeek(cwShifts.filter(s => s.status === "completed").length);
    setToday(now);
  }, [weeks]);

  return (
    <div className="space-y-4">
      {/* This week summary */}
      <CRCard>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-3">This Week</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-cr-charcoal">{currentWeekShifts.length}</p>
            <p className="text-xs text-cr-slate">Scheduled</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{completedThisWeek}</p>
            <p className="text-xs text-cr-slate">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-cr-charcoal">{hoursThisWeek.toFixed(1)}h</p>
            <p className="text-xs text-cr-slate">
              {user?.contract_hours ? `/ ${user.contract_hours}h contracted` : "hours"}
            </p>
          </div>
        </div>
      </CRCard>

      {/* Weekly breakdown */}
      {weekEntries.length === 0 ? (
        <CRCard>
          <div className="text-center py-10">
            <Calendar className="mx-auto mb-2 text-cr-slate opacity-40" size={32} />
            <p className="font-medium text-cr-charcoal">No upcoming shifts</p>
            <p className="text-sm text-cr-slate">Check back with your manager</p>
          </div>
        </CRCard>
      ) : (
        weekEntries.map(([weekKey, weekShifts]) => {
          const weekStart = new Date(weekKey);
          const weekEnd = new Date(weekKey);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const totalHours = weekShifts.reduce((sum, s) => sum + hoursInShift(s), 0);
          const isCurrentWeek = weekKey === currentWeekKey;

          return (
            <CRCard key={weekKey}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-cr-charcoal text-sm">
                    {isCurrentWeek ? "This week" : `Week of ${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                  </h3>
                  <p className="text-xs text-cr-slate">
                    {weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} —{" "}
                    {weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-cr-charcoal">{totalHours.toFixed(1)}h</span>
              </div>

              {/* Day grid */}
              <div className="space-y-2">
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const day = new Date(weekStart);
                  day.setDate(day.getDate() + dayIdx);
                  const dayShifts = weekShifts.filter(s => {
                    const sd = new Date(s.scheduled_start);
                    return sd.getFullYear() === day.getFullYear() &&
                      sd.getMonth() === day.getMonth() &&
                      sd.getDate() === day.getDate();
                  });
                  const isToday = today ? day.toDateString() === today.toDateString() : false;

                  return (
                    <div key={dayIdx} className={`flex items-center gap-3 py-1.5 ${isToday ? "bg-cr-mint rounded-lg px-2" : ""}`}>
                      <div className="w-8 text-center flex-shrink-0">
                        <p className="text-[10px] text-cr-slate">{DAY_NAMES[dayIdx]}</p>
                        <p className={`text-sm font-semibold ${isToday ? "text-cr-forest" : "text-cr-charcoal"}`}>
                          {day.getDate()}
                        </p>
                      </div>
                      {dayShifts.length === 0 ? (
                        <p className="text-xs text-cr-slate flex-1">Rest day</p>
                      ) : (
                        <div className="flex-1 space-y-1">
                          {dayShifts.map(shift => (
                            <Link key={shift.id} href={`/carer/shift/${shift.id}`}
                              className="flex items-center gap-2 text-xs">
                              {statusIcon(shift.status)}
                              <span className="text-cr-charcoal font-medium">
                                {new Date(shift.scheduled_start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                {" — "}
                                {new Date(shift.scheduled_end).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span className="text-cr-slate">
                                ({hoursInShift(shift).toFixed(1)}h
                                {shift.client_ids?.length ? `, ${shift.client_ids.length} client${shift.client_ids.length > 1 ? "s" : ""}` : ""})
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CRCard>
          );
        })
      )}
    </div>
  );
}
