"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  falls_risk_score: z.coerce.number().min(0).max(20).default(0),
  falls_risk_notes: z.string().optional(),
  pressure_sore_risk: z.string().default("low"),
  pressure_sore_notes: z.string().optional(),
  safeguarding_concern: z.boolean().default(false),
  safeguarding_notes: z.string().optional(),
  environmental_risks: z.string().optional(),
  medication_risk: z.string().default("low"),
  wandering_risk: z.boolean().default(false),
  self_harm_risk: z.boolean().default(false),
  lone_working_considerations: z.string().optional(),
  overall_risk_level: z.string().default("low"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  clientId: string;
  onComplete: (data: FormData) => void;
  onBack: () => void;
}

export function StepRiskAssessment({ clientId, onComplete, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { falls_risk_score: 0, pressure_sore_risk: "low", medication_risk: "low", overall_risk_level: "low" },
  });

  const fallsScore = watch("falls_risk_score");
  const safeguarding = watch("safeguarding_concern");
  const selfHarm = watch("self_harm_risk");

  const getFallsRiskBand = (score: number) => {
    if (score <= 5) return { label: "Low", color: "text-green-600" };
    if (score <= 10) return { label: "Medium", color: "text-amber-600" };
    if (score <= 15) return { label: "High", color: "text-orange-600" };
    return { label: "Very High", color: "text-cr-red" };
  };

  const band = getFallsRiskBand(Number(fallsScore));

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userRecord } = await supabase.from("users")
        .select("organisation_id, id").eq("id", user!.id).single();

      const riskLevel = data.safeguarding_concern || data.self_harm_risk || Number(data.falls_risk_score) > 15
        ? "critical"
        : Number(data.falls_risk_score) > 10
        ? "high"
        : data.pressure_sore_risk === "high"
        ? "medium"
        : "low";

      await supabase.from("clients").update({
        risk_level: riskLevel,
        onboarding_step: 5,
      }).eq("id", clientId);

      await supabase.from("risk_assessments").insert({
        client_id: clientId,
        organisation_id: userRecord?.organisation_id,
        assessor_id: userRecord?.id,
        risk_level: riskLevel,
        falls_risk_score: data.falls_risk_score,
        environmental_risks: data.environmental_risks,
        medication_risks: data.medication_risk,
        notes: [data.falls_risk_notes, data.pressure_sore_notes, data.safeguarding_notes].filter(Boolean).join("\n"),
        next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });

      onComplete(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {(safeguarding || selfHarm) && (
        <CRAlertBanner
          variant="red"
          title="High Risk Indicators Present"
          description="This client has safeguarding or self-harm risk flags. Manager review will be required before care plan activation."
        />
      )}

      {/* Falls Risk */}
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Falls Risk Assessment</h3>
        <div className="flex items-center gap-6 mb-3">
          <div className="flex-1">
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-2">
              Risk score (0–20): <span className={cn("font-bold", band.color)}>{fallsScore} — {band.label}</span>
            </label>
            <input type="range" {...register("falls_risk_score")} min={0} max={20} step={1} className="w-full accent-cr-forest" />
            <div className="flex justify-between text-xs text-cr-slate mt-1">
              <span>0 (None)</span><span>5</span><span>10</span><span>15</span><span>20 (Extreme)</span>
            </div>
          </div>
        </div>
        <textarea
          {...register("falls_risk_notes")}
          rows={2}
          placeholder="Notes on falls risk factors (e.g. previous falls history, environmental factors...)"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
        />
      </CRCard>

      {/* Pressure Sore Risk */}
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Pressure Sore / Skin Integrity Risk</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {["low", "medium", "high"].map((level) => (
            <label key={level} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-cr-forest">
              <input type="radio" {...register("pressure_sore_risk")} value={level} className="accent-cr-forest" />
              <span className="text-sm font-body capitalize">{level}</span>
            </label>
          ))}
        </div>
        <textarea
          {...register("pressure_sore_notes")}
          rows={2}
          placeholder="Notes on skin integrity, repositioning schedule, specialist equipment..."
          className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
        />
      </CRCard>

      {/* Safeguarding & Behaviour */}
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Safeguarding & Behavioural Risk</h3>
        <div className="space-y-3">
          {[
            { name: "safeguarding_concern", label: "Safeguarding concern (refer to local authority if yes)" },
            { name: "wandering_risk", label: "Risk of wandering or leaving unsupervised" },
            { name: "self_harm_risk", label: "Risk of self-harm (escalate to manager immediately)" },
          ].map(({ name, label }) => (
            <label key={name} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...register(name as keyof FormData)} className="w-5 h-5 accent-cr-red" />
              <span className="text-sm font-body text-cr-charcoal">{label}</span>
            </label>
          ))}
          {safeguarding && (
            <textarea
              {...register("safeguarding_notes")}
              rows={3}
              placeholder="Safeguarding concern details (will be visible to managers only)..."
              className="w-full px-3 py-2 rounded-lg border border-red-200 bg-red-50 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-red/30 mt-2"
            />
          )}
        </div>
      </CRCard>

      {/* Environmental & Medication Risk */}
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Environmental & Medication Risk</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Environmental risks</label>
            <textarea
              {...register("environmental_risks")}
              rows={2}
              placeholder="e.g. loose rugs, poor lighting, steep stairs, no handrail..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-2">Medication risk level</label>
            <div className="flex gap-3">
              {["low", "medium", "high"].map((level) => (
                <label key={level} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-200">
                  <input type="radio" {...register("medication_risk")} value={level} className="accent-cr-forest" />
                  <span className="text-sm font-body capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Lone working considerations</label>
            <textarea
              {...register("lone_working_considerations")}
              rows={2}
              placeholder="Any safety concerns for lone carers visiting this client..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            />
          </div>
        </div>
      </CRCard>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="cr-btn-secondary px-6 py-3 text-sm">← Back</button>
        <button type="submit" disabled={loading} className="cr-btn-primary flex items-center gap-2 px-6 py-3">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Saving..." : "Continue to Nutrition Plan →"}
        </button>
      </div>
    </form>
  );
}
