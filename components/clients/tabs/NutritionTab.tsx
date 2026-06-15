"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRStepList } from "@/components/ui/CRStepList";
import { CRBadge } from "@/components/ui/CRBadge";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { Utensils } from "lucide-react";

interface Props {
  client: Record<string, unknown>;
  nutritionProfile: Record<string, unknown> | null;
}

export function ClientNutritionTab({ client, nutritionProfile }: Props) {
  const supabase = createClient();
  const [mealPreferences, setMealPreferences] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    supabase.from("meal_preferences").select("*")
      .eq("client_id", String(client.id))
      .then(({ data }) => setMealPreferences(data || []));
  }, [client.id]);

  if (!nutritionProfile) {
    return (
      <CREmptyState
        icon={<Utensils className="text-cr-slate" size={40} />}
        title="No nutrition plan"
        description="A nutrition plan will be created during client onboarding"
      />
    );
  }

  const dietTypes = (nutritionProfile.diet_types as string[]) || [];

  const textureLabels: Record<string, string> = {
    regular: "Regular",
    soft_bite_size: "Soft, bite-size",
    minced_moist: "Minced & moist",
    pureed: "Puréed",
    liquidised: "Liquidised",
  };

  const fluidLabels: Record<string, string> = {
    regular: "Regular",
    slightly_thick: "Slightly thick (115)",
    mildly_thick: "Mildly thick (150)",
    moderately_thick: "Moderately thick (400)",
    extremely_thick: "Extremely thick (900)",
  };

  return (
    <div className="space-y-6">
      {/* Diet overview */}
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Dietary Requirements</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs font-body font-medium text-cr-slate uppercase mb-1">Diet types</p>
            <div className="flex flex-wrap gap-1">
              {dietTypes.length > 0 ? dietTypes.map((d) => (
                <CRBadge key={d} variant="forest">{d}</CRBadge>
              )) : <span className="text-sm text-cr-slate">Standard</span>}
            </div>
          </div>
          <div>
            <p className="text-xs font-body font-medium text-cr-slate uppercase mb-1">Food texture (IDDSI)</p>
            <CRBadge variant="blue">{textureLabels[String(nutritionProfile.texture_level)] || String(nutritionProfile.texture_level)}</CRBadge>
          </div>
          <div>
            <p className="text-xs font-body font-medium text-cr-slate uppercase mb-1">Fluid consistency</p>
            <CRBadge variant="blue">{fluidLabels[String(nutritionProfile.fluid_consistency)] || String(nutritionProfile.fluid_consistency)}</CRBadge>
          </div>
          {nutritionProfile.fluid_intake_target_ml && (
            <div>
              <p className="text-xs font-body font-medium text-cr-slate uppercase mb-1">Fluid target</p>
              <p className="text-sm font-body font-semibold text-cr-charcoal">{String(nutritionProfile.fluid_intake_target_ml)} ml/day</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {nutritionProfile.feeding_assistance_required && (
            <CRBadge variant="amber">Feeding assistance required</CRBadge>
          )}
          {nutritionProfile.supplement_drinks && (
            <CRBadge variant="amber">
              Supplement drinks: {nutritionProfile.supplement_name ? String(nutritionProfile.supplement_name) : "required"}
            </CRBadge>
          )}
        </div>
      </CRCard>

      {/* Cultural context */}
      {nutritionProfile.cultural_food_notes && (
        <CRCard>
          <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-2">Cultural Food Preferences</h3>
          <p className="text-sm font-body text-cr-charcoal leading-relaxed">{String(nutritionProfile.cultural_food_notes)}</p>
        </CRCard>
      )}

      {/* Nutritional goals */}
      {nutritionProfile.nutritional_goals && (
        <CRCard>
          <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-2">Nutritional Goals</h3>
          <p className="text-sm font-body text-cr-charcoal">{String(nutritionProfile.nutritional_goals)}</p>
        </CRCard>
      )}

      {/* Meal preferences with step-by-step */}
      {mealPreferences.length > 0 && (
        <div>
          <h3 className="font-display text-xl font-semibold text-cr-charcoal mb-4">Meal Preferences & Preparation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mealPreferences.map((pref) => {
              const steps = (pref.preparation_steps as string[]) || [];
              return (
                <CRCard key={String(pref.id)}>
                  <h4 className="font-display text-lg font-semibold text-cr-charcoal mb-2">{String(pref.meal_time)}</h4>
                  {pref.preferred_items && (
                    <p className="text-sm font-body text-cr-charcoal mb-3">{String(pref.preferred_items)}</p>
                  )}
                  {steps.length > 0 && (
                    <>
                      <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-2">Preparation steps</p>
                      <CRStepList steps={steps} />
                    </>
                  )}
                  {pref.notes && (
                    <p className="text-xs text-cr-slate mt-2 italic">{String(pref.notes)}</p>
                  )}
                </CRCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
