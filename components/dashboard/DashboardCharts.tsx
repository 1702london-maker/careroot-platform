"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { CRCard } from "@/components/ui/CRCard";

interface VisitStatusData {
  completed: number;
  in_progress: number;
  scheduled: number;
  missed: number;
  cancelled: number;
}

interface WeeklyPoint {
  day: string;
  visits: number;
  completed: number;
}

interface DashboardChartsProps {
  visitStatus: VisitStatusData;
  weeklyVisits: WeeklyPoint[];
}

const PIE_COLORS: Record<string, string> = {
  completed: "#1A3C2E",
  in_progress: "#4A7C5E",
  scheduled: "#E8F5EE",
  missed: "#DC2626",
  cancelled: "#9CA3AF",
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-card rounded-lg px-3 py-2">
      {label && <p className="text-xs font-body font-semibold text-cr-charcoal mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-xs font-body" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export function DashboardCharts({ visitStatus, weeklyVisits }: DashboardChartsProps) {
  const pieData = Object.entries(visitStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.replace("_", " "), value, key: name }));

  const totalVisits = Object.values(visitStatus).reduce((a, b) => a + b, 0);
  const completionRate = totalVisits > 0
    ? Math.round((visitStatus.completed / totalVisits) * 100)
    : 0;

  const weekTotal = weeklyVisits.reduce((a, b) => a + b.visits, 0);
  const weekCompleted = weeklyVisits.reduce((a, b) => a + b.completed, 0);
  const weekRate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

      {/* Visit status pie */}
      <CRCard>
        <h3 className="font-display text-base font-semibold text-cr-charcoal mb-1">Visit Status</h3>
        <p className="text-xs font-body text-cr-slate mb-4">{totalVisits} total today</p>
        {totalVisits === 0 ? (
          <div className="flex items-center justify-center h-[160px] text-xs font-body text-cr-slate">No visits today</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={PIE_COLORS[entry.key] ?? "#E5E7EB"} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs font-body text-cr-slate capitalize">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CRCard>

      {/* Weekly visits bar */}
      <CRCard>
        <h3 className="font-display text-base font-semibold text-cr-charcoal mb-1">Weekly Visits</h3>
        <p className="text-xs font-body text-cr-slate mb-4">Scheduled vs completed</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyVisits} barGap={2} barCategoryGap="35%">
            <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: "DM Sans", fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="visits" name="Scheduled" fill="#E8F5EE" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Completed" fill="#1A3C2E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CRCard>

      {/* Completion rate summary */}
      <CRCard>
        <h3 className="font-display text-base font-semibold text-cr-charcoal mb-1">Completion Rate</h3>
        <p className="text-xs font-body text-cr-slate mb-5">Today and this week</p>
        <div className="space-y-5">
          {[
            { label: "Today", rate: completionRate, completed: visitStatus.completed, total: totalVisits },
            { label: "This week", rate: weekRate, completed: weekCompleted, total: weekTotal },
          ].map(({ label, rate, completed, total }) => {
            const color = rate >= 90 ? "#1A3C2E" : rate >= 70 ? "#F59E0B" : "#DC2626";
            return (
              <div key={label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-body font-medium text-cr-charcoal">{label}</span>
                  <span className="text-sm font-body font-semibold" style={{ color }}>
                    {completed}/{total} <span className="text-xs font-normal">({rate}%)</span>
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${rate}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between text-xs font-body text-cr-slate">
              <span>Missed today</span>
              <span className={visitStatus.missed > 0 ? "text-cr-red font-semibold" : "text-cr-slate"}>
                {visitStatus.missed}
              </span>
            </div>
            <div className="flex justify-between text-xs font-body text-cr-slate mt-1">
              <span>In progress</span>
              <span>{visitStatus.in_progress}</span>
            </div>
          </div>
        </div>
      </CRCard>
    </div>
  );
}
