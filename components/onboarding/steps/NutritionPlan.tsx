"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRStepList } from "@/components/ui/CRStepList";
import { Plus, Trash2, Loader2 } from "lucide-react";

const DIET_TYPES = [
  "Standard", "Diabetic", "Vegetarian", "Vegan", "Halal", "Kosher",
  "Gluten-free", "Low-sodium", "Soft/minced", "Puréed", "Fortified",
];

const TEXTURE_LEVELS = [
  { value: "regular", label: "Regular" },
  { value: "soft_bite_size", label: "Soft, bite-size pieces" },
  { value: "minced_moist", label: "Minced & moist" },
  { value: "pureed", label: "Puréed" },
  { value: "liquidised", label: "Liquidised" },
];

const FLUID_CONSISTENCIES = [
  { value: "regular", label: "Regular" },
  { value: "slightly_thick", label: "Slightly thick (115)" },
  { value: "mildly_thick", label: "Mildly thick (150)" },
  { value: "moderately_thick", label: "Moderately thick (400)" },
  { value: "extremely_thick", label: "Extremely thick (900)" },
];

const schema = z.object({
  diet_types: z.array(z.string()).default([]),
  texture_level: z.string().default("regular"),
  fluid_consistency: z.string().default("regular"),
  cultural_food_notes: z.string().optional(),
  nutritional_goals: z.string().optional(),
  meal_preferences: z.array(z.object({
    meal_time: z.string(),
    preferred_items: z.string().optional(),
    preparation_steps: z.array(z.string()).default([]),
    notes: z.string().optional(),
  })).default([]),
  supplement_drinks: z.boolean().default(false),
  supplement_name: z.string().optional(),
  feeding_assistance_required: z.boolean().default(false),
  fluid_intake_target_ml: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  clientId: string;
  onComplete: (data: FormData) => void;
  onBack: () => void;
}

export function StepNutritionPlan({ clientId, onComplete, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [mealStepInputs, setMealStepInputs] = useState<Record<number, string>>({});
  const supabase = createClient();

  const { register, handleSubmit, control, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      diet_types: [],
      texture_level: "regular",
      fluid_consistency: "regular",
      meal_preferences: [
        { meal_time: "Breakfast", preferred_items: "", preparation_steps: [], notes: "" },
        { meal_time: "Lunch", preferred_items: "", preparation_steps: [], notes: "" },
        { meal_time: "Dinner", preferred_items: "", preparation_steps: [], notes: "" },
        { meal_time: "Snacks", preferred_items: "", preparation_steps: [], notes: "" },
      ],
    },
  });

  const { fields } = useFieldArray({ control, name: "meal_preferences" });
  const dietTypes = watch("diet_types") || [];
  const supplements = watch("supplement_drinks");

  const toggleDiet = (type: string) => {
    const updated = dietTypes.includes(type)
      ? dietTypes.filter((d) => d !== type)
      : [...dietTypes, type];
    setValue("diet_types", updated);
  };

  const addStep = (mealIndex: number) => {
    const input = mealStepInputs[mealIndex]?.trim();
    if (!input) return;
    const current = watch(`meal_preferences.${mealIndex}.preparation_steps`) || [];
    setValue(`meal_preferences.${mealIndex}.preparation_steps`, [...current, input]);
    setMealStepInputs((prev) => ({ ...prev, [mealIndex]: "" }));
  };

  const removeStep = (mealIndex: number, stepIndex: number) => {
    const current = watch(`meal_preferences.${mealIndex}.preparation_steps`) || [];
    setValue(`meal_preferences.${mealIndex}.preparation_steps`, current.filter((_, i) => i !== stepIndex));
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userRecord } = await supabase.from("users")
        .select("organisation_id").eq("id", user!.id).single();

      await supabase.from("nutrition_profiles").insert({
        client_id: clientId,
        organisation_id: userRecord?.organisation_id,
        diet_types: data.diet_types,
        texture_level: data.texture_level,
        fluid_consistency: data.fluid_consistency,
        cultural_food_notes: data.cultural_food_notes,
        nutritional_goals: data.nutritional_goals,
        supplement_drinks: data.supplement_drinks,
        supplement_name: data.supplement_name,
        feeding_assistance_required: data.feeding_assistance_required,
        fluid_intake_target_ml: data.fluid_intake_target_ml,
      });

      for (const pref of data.meal_preferences) {
        if (pref.preferred_items || pref.preparation_steps.length > 0) {
          await supabase.from("meal_preferences").insert({
            client_id: clientId,
            organisation_id: userRecord?.organisation_id,
            meal_time: pref.meal_time,
            preferred_items: pref.preferred_items,
            preparation_steps: pref.preparation_steps,
            notes: pref.notes,
          });
        }
      }

      await supabase.from("clients").update({ onboarding_step: 6 }).eq("id", clientId);
      onComplete(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Dietary Requirements</h3>
        <div className="flex flex-wrap gap-2">
          {DIET_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleDiet(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-body transition-all border ${
                dietTypes.includes(type)
                  ? "bg-cr-forest text-white border-cr-forest"
                  : "bg-white text-cr-charcoal border-gray-200 hover:border-cr-forest"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </CRCard>

      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Texture & Fluid</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-2">Food texture level (IDDSI)</label>
            <div className="space-y-2">
              {TEXTURE_LEVELS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" {...register("texture_level")} value={value} className="accent-cr-forest" />
                  <span className="text-sm font-body">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-2">Fluid consistency (IDDSI)</label>
            <div className="space-y-2">
              {FLUID_CONSISTENCIES.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" {...register("fluid_consistency")} value={value} className="accent-cr-forest" />
                  <span className="text-sm font-body">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </CRCard>

      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Cultural & Dietary Context</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Cultural food preferences and beliefs</label>
            <textarea
              {...register("cultural_food_notes")}
              rows={3}
              placeholder="e.g. Nigerian cuisine preferred, avoids pork for religious reasons, likes spicy food, comfort foods from childhood..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Nutritional goals</label>
            <textarea
              {...register("nutritional_goals")}
              rows={2}
              placeholder="e.g. weight gain, maintaining weight, fluid balance, managing diabetes..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Daily fluid target (ml)</label>
              <input
                type="number"
                {...register("fluid_intake_target_ml")}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
              />
            </div>
          </div>
          <div className="space-y-2">
            {[
              { name: "feeding_assistance_required", label: "Requires assistance with eating/feeding" },
              { name: "supplement_drinks", label: "Requires nutritional supplement drinks" },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register(name as keyof FormData)} className="w-4 h-4 accent-cr-forest" />
                <span className="text-sm font-body text-cr-charcoal">{label}</span>
              </label>
            ))}
            {supplements && (
              <input
                {...register("supplement_name")}
                placeholder="Supplement drink name (e.g. Ensure, Fortisip...)"
                className="ml-7 px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
              />
            )}
          </div>
        </div>
      </CRCard>

      {/* Meal Preferences with preparation steps */}
      {fields.map((field, i) => {
        const steps = watch(`meal_preferences.${i}.preparation_steps`) || [];
        return (
          <CRCard key={field.id}>
            <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">
              {field.meal_time} Preferences
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Preferred foods / meals</label>
                <textarea
                  {...register(`meal_preferences.${i}.preferred_items`)}
                  rows={2}
                  placeholder={`e.g. ${field.meal_time === "Breakfast" ? "porridge, toast with butter, tea with 2 sugars" : field.meal_time === "Lunch" ? "soup, sandwich, fruit" : field.meal_time === "Dinner" ? "chicken and rice, fish and chips" : "biscuits with tea, fruit"}`}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
                />
              </div>

              {/* Preparation steps */}
              <div>
                <label className="block text-sm font-body font-medium text-cr-charcoal mb-2">
                  Step-by-step preparation instructions
                  <span className="text-xs font-normal text-cr-slate ml-2">(shown to carers during visits)</span>
                </label>
                {steps.length > 0 && <CRStepList steps={steps} className="mb-3" />}
                <div className="flex gap-2">
                  <input
                    value={mealStepInputs[i] || ""}
                    onChange={(e) => setMealStepInputs((prev) => ({ ...prev, [i]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStep(i); } }}
                    placeholder="Add a step (e.g. 'Cut toast into small squares')"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
                  />
                  <button
                    type="button"
                    onClick={() => addStep(i)}
                    className="px-3 py-2 bg-cr-forest text-white rounded-lg text-sm hover:bg-cr-sage"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {steps.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {steps.map((step, si) => (
                      <div key={si} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded-lg">
                        <span className="text-sm font-body text-cr-charcoal">{si + 1}. {step}</span>
                        <button type="button" onClick={() => removeStep(i, si)} className="text-cr-red ml-2">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Notes</label>
                <input
                  {...register(`meal_preferences.${i}.notes`)}
                  placeholder="Any other meal notes..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
                />
              </div>
            </div>
          </CRCard>
        );
      })}

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="cr-btn-secondary px-6 py-3 text-sm">← Back</button>
        <button type="submit" disabled={loading} className="cr-btn-primary flex items-center gap-2 px-6 py-3">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Saving..." : "Continue to Care Plan →"}
        </button>
      </div>
    </form>
  );
}
