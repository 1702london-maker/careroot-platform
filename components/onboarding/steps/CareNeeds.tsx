"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { Loader2 } from "lucide-react";

const PERSONAL_CARE_TASKS = [
  "Washing/bathing", "Dressing/undressing", "Oral hygiene", "Hair care",
  "Shaving", "Nail care", "Continence support", "Catheter care",
  "Stoma care", "Pressure area care",
];

const MEAL_TASKS = [
  "Meal preparation", "Eating assistance", "Feeding", "Fluid monitoring",
  "PEG feeding", "Thickened fluids",
];

const MOBILITY_TASKS = [
  "Walking assistance", "Transfers", "Hoist use", "Wheelchair", "Turning in bed",
];

const DOMESTIC_TASKS = [
  "Light housework", "Laundry", "Shopping assistance", "Medication prompting",
  "Medication administration", "Companionship", "Pet care",
];

const VISIT_FREQUENCIES = [
  "Once daily", "Twice daily", "Three times daily", "Four times daily",
  "Morning only", "Evening only", "Night-time only", "24-hour live-in",
  "Weekly", "As needed",
];

const schema = z.object({
  personal_care: z.array(z.string()).default([]),
  meal_tasks: z.array(z.string()).default([]),
  mobility_tasks: z.array(z.string()).default([]),
  domestic_tasks: z.array(z.string()).default([]),
  visit_frequency: z.string().default(""),
  visit_duration_minutes: z.coerce.number().min(15).default(60),
  preferred_carer_gender: z.string().optional(),
  care_notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  clientId: string;
  onComplete: (data: FormData) => void;
  onBack: () => void;
}

export function StepCareNeeds({ clientId, onComplete, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { personal_care: [], meal_tasks: [], mobility_tasks: [], domestic_tasks: [] },
  });

  const toggle = (field: keyof FormData, value: string) => {
    const current = (watch(field) as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(field, updated as never);
  };

  const CheckGroup = ({
    label,
    field,
    items,
  }: { label: string; field: keyof FormData; items: string[] }) => {
    const selected = (watch(field) as string[]) || [];
    return (
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">{label}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {items.map((item) => (
            <label key={item} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => toggle(field, item)}
                className="w-4 h-4 accent-cr-forest"
              />
              <span className="text-sm font-body text-cr-charcoal">{item}</span>
            </label>
          ))}
        </div>
      </CRCard>
    );
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await supabase.from("clients").update({
        care_needs: {
          personal_care: data.personal_care,
          meal_tasks: data.meal_tasks,
          mobility_tasks: data.mobility_tasks,
          domestic_tasks: data.domestic_tasks,
          visit_frequency: data.visit_frequency,
          visit_duration_minutes: data.visit_duration_minutes,
          preferred_carer_gender: data.preferred_carer_gender,
          care_notes: data.care_notes,
        },
        onboarding_step: 4,
      }).eq("id", clientId);

      onComplete(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <CheckGroup label="Personal Care Tasks" field="personal_care" items={PERSONAL_CARE_TASKS} />
      <CheckGroup label="Meals & Nutrition Support" field="meal_tasks" items={MEAL_TASKS} />
      <CheckGroup label="Mobility Support" field="mobility_tasks" items={MOBILITY_TASKS} />
      <CheckGroup label="Domestic & Social Tasks" field="domestic_tasks" items={DOMESTIC_TASKS} />

      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Visit Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Visit frequency</label>
            <select
              {...register("visit_frequency")}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            >
              <option value="">Select frequency</option>
              {VISIT_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Duration (minutes)</label>
            <input
              type="number"
              {...register("visit_duration_minutes")}
              min={15}
              step={15}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Preferred carer gender</label>
            <select
              {...register("preferred_carer_gender")}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            >
              <option value="">No preference</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Additional care notes</label>
          <textarea
            {...register("care_notes")}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            placeholder="Any other care preferences or requirements..."
          />
        </div>
      </CRCard>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="cr-btn-secondary px-6 py-3 text-sm">← Back</button>
        <button type="submit" disabled={loading} className="cr-btn-primary flex items-center gap-2 px-6 py-3">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Saving..." : "Continue to Risk Assessment →"}
        </button>
      </div>
    </form>
  );
}
