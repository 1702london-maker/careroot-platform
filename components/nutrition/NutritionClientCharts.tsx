"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine,
} from "recharts";
import { CRCard } from "@/components/ui/CRCard";

interface MealRecord {
  recorded_at: string;
  consumption_level: string;
  fluid_intake_ml?: number;
  meal_time?: string;
}

interface Props {
  records: MealRecord[];
  fluidTarget: number;
}

const CONSUMPTION_SCORE: Record<string, number> = {
  all: 100, most: 75, half: 50, little: 25, refused: 0,
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-card rounded-lg px-3 py-2">
      {label && <p className="text-xs font-body font-semibold text-cr-charcoal mb-1">{label}</p>}
      {payload.map(p => (
        <p key={p.name} className="text-xs font-body" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export function NutritionClientCharts({ records, fluidTarget }: Props) {
  // Daily intake score — last 14 days
  const last14: Record<string, { scores: number[]; fluid: number[] }> = {};
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    last14[key] = { scores: [], fluid: [] };
  }

  records.forEach(r => {
    const d = new Date(r.recorded_at);
    const key = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    if (last14[key]) {
      last14[key].scores.push(CONSUMPTION_SCORE[r.consumption_level] ?? 50);
      if (r.fluid_intake_ml) last14[key].fluid.push(r.fluid_intake_ml);
    }
  });

  const dailyData = Object.entries(last14).map(([day, { scores, fluid }]) => ({
    day,
    intake: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    fluid: fluid.length ? fluid.reduce((a, b) => a + b, 0) : null,
    meals: scores.length,
  }));

  // Meal time breakdown — count per slot
  const mealTimeCount: Record<string, { good: number; poor: number }> = {
    breakfast: { good: 0, poor: 0 },
    morning_snack: { good: 0, poor: 0 },
    lunch: { good: 0, poor: 0 },
    afternoon_snack: { good: 0, poor: 0 },
    dinner: { good: 0, poor: 0 },
    evening_snack: { good: 0, poor: 0 },
  };
  records.forEach(r => {
    const slot = r.meal_time ?? "lunch";
    if (mealTimeCount[slot]) {
      const score = CONSUMPTION_SCORE[r.consumption_level] ?? 50;
      if (score >= 75) mealTimeCount[slot].good++;
      else mealTimeCount[slot].poor++;
    }
  });
  const mealTimeData = Object.entries(mealTimeCount)
    .filter(([, v]) => v.good + v.poor > 0)
    .map(([slot, v]) => ({
      slot: slot.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
      good: v.good,
      poor: v.poor,
    }));

  return (
    <div className="space-y-5">
      {/* Intake trend */}
      <CRCard>
        <h3 className="font-display text-base font-semibold text-cr-charcoal mb-1">Intake Score — Last 14 Days</h3>
        <p className="text-xs font-body text-cr-slate mb-4">100 = full meal eaten · 0 = refused</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: "DM Sans", fill: "#6B7280" }} axisLine={false} tickLine={false} interval={1} />
            <YAxis domain={[0, 100]} hide />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={75} stroke="#1A3C2E" strokeDasharray="4 2" strokeOpacity={0.4} label={{ value: "Good", position: "right", fontSize: 10, fill: "#1A3C2E" }} />
            <Line
              type="monotone"
              dataKey="intake"
              name="Intake score"
              stroke="#1A3C2E"
              strokeWidth={2}
              dot={{ fill: "#1A3C2E", r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CRCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Fluid intake */}
        <CRCard>
          <h3 className="font-display text-base font-semibold text-cr-charcoal mb-1">Daily Fluid Intake</h3>
          <p className="text-xs font-body text-cr-slate mb-4">
            {fluidTarget ? `Target: ${fluidTarget}ml/day` : "No daily target set"}
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData.slice(-10)}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: "DM Sans", fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              {fluidTarget > 0 && (
                <ReferenceLine y={fluidTarget} stroke="#F59E0B" strokeDasharray="4 2" strokeOpacity={0.7} />
              )}
              <Bar dataKey="fluid" name="Fluid (ml)" fill="#3B82F6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CRCard>

        {/* Meal time breakdown */}
        {mealTimeData.length > 0 && (
          <CRCard>
            <h3 className="font-display text-base font-semibold text-cr-charcoal mb-1">Intake by Meal Time</h3>
            <p className="text-xs font-body text-cr-slate mb-4">Good vs poor intake per slot</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={mealTimeData} barGap={2}>
                <XAxis dataKey="slot" tick={{ fontSize: 9, fontFamily: "DM Sans", fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="good" name="Good intake" fill="#1A3C2E" radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="poor" name="Poor intake" fill="#FCA5A5" radius={[3, 3, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CRCard>
        )}
      </div>
    </div>
  );
}
