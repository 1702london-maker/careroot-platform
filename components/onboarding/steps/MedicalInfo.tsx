"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { Plus, Trash2, Loader2 } from "lucide-react";

const schema = z.object({
  conditions: z.array(z.object({ name: z.string() })).default([]),
  allergies: z.array(z.object({
    name: z.string().min(1),
    severity: z.string(),
    description: z.string().optional(),
  })).default([]),
  intolerances: z.array(z.object({ name: z.string() })).default([]),
  dnr_status: z.boolean().default(false),
  mobility_needs: z.string().optional(),
  physical_needs: z.string().optional(),
  mental_capacity_notes: z.string().optional(),
  medications: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    route: z.string().optional(),
    prescriber: z.string().optional(),
  })).default([]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  clientId: string;
  onComplete: (data: FormData) => void;
  onBack: () => void;
}

export function StepMedicalInfo({ clientId, onComplete, onBack }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, control, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { conditions: [], allergies: [], intolerances: [], medications: [], dnr_status: false },
  });

  const dnr = watch("dnr_status");

  const { fields: conditionFields, append: addCondition, remove: removeCondition } = useFieldArray({ control, name: "conditions" });
  const { fields: allergyFields, append: addAllergy, remove: removeAllergy } = useFieldArray({ control, name: "allergies" });
  const { fields: intoleranceFields, append: addIntolerance, remove: removeIntolerance } = useFieldArray({ control, name: "intolerances" });
  const { fields: medFields, append: addMed, remove: removeMed } = useFieldArray({ control, name: "medications" });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userRecord } = await supabase.from("users")
        .select("organisation_id").eq("id", user!.id).single();

      // Update client
      await supabase.from("clients").update({
        dnr_status: data.dnr_status,
        notes: [data.mobility_needs, data.physical_needs, data.mental_capacity_notes].filter(Boolean).join("\n"),
        onboarding_step: 3,
      }).eq("id", clientId);

      // Create medications
      for (const med of data.medications) {
        if (med.name) {
          await supabase.from("medications").insert({
            client_id: clientId,
            organisation_id: userRecord?.organisation_id,
            ...med,
            is_active: true,
          });
        }
      }

      onComplete(data);
    } catch {
      setError("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {dnr && (
        <CRAlertBanner
          variant="red"
          title="DNR ORDER IN PLACE — Do Not Resuscitate"
          description="This will be displayed prominently on all screens showing this client's information."
        />
      )}

      <CRCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-cr-charcoal">DNR Status</h2>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register("dnr_status")} className="w-5 h-5 accent-cr-red" />
          <span className="text-sm font-body font-medium text-cr-charcoal">
            Do Not Resuscitate (DNR) order in place
          </span>
        </label>
      </CRCard>

      <CRCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-cr-charcoal">Medical Conditions</h2>
          <button type="button" onClick={() => addCondition({ name: "" })} className="flex items-center gap-1.5 text-sm text-cr-forest">
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {conditionFields.map((f, i) => (
            <div key={f.id} className="flex gap-2">
              <input
                {...register(`conditions.${i}.name`)}
                placeholder="e.g. Type 2 Diabetes, Dementia..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
              />
              <button type="button" onClick={() => removeCondition(i)} className="text-cr-red">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {conditionFields.length === 0 && <p className="text-sm text-cr-slate">No conditions added</p>}
        </div>
      </CRCard>

      <CRCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-cr-charcoal">
            Known Allergies
          </h2>
          <button type="button" onClick={() => addAllergy({ name: "", severity: "mild" })} className="flex items-center gap-1.5 text-sm text-cr-forest">
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="space-y-3">
          {allergyFields.map((f, i) => (
            <div key={f.id} className="p-3 bg-red-50 rounded-xl border border-red-200">
              <div className="grid grid-cols-3 gap-2">
                <input
                  {...register(`allergies.${i}.name`)}
                  placeholder="Allergy name"
                  className="px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-red/30"
                />
                <select
                  {...register(`allergies.${i}.severity`)}
                  className="px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-white"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="anaphylactic">Anaphylactic ⚠️</option>
                </select>
                <div className="flex gap-2">
                  <input
                    {...register(`allergies.${i}.description`)}
                    placeholder="Description (optional)"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none"
                  />
                  <button type="button" onClick={() => removeAllergy(i)} className="text-cr-red">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {allergyFields.length === 0 && <p className="text-sm text-cr-slate">No allergies recorded</p>}
        </div>
      </CRCard>

      <CRCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-cr-charcoal">Food Intolerances</h2>
          <button type="button" onClick={() => addIntolerance({ name: "" })} className="flex items-center gap-1.5 text-sm text-cr-forest">
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {intoleranceFields.map((f, i) => (
            <div key={f.id} className="flex gap-2">
              <input
                {...register(`intolerances.${i}.name`)}
                placeholder="e.g. Lactose, Gluten..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
              />
              <button type="button" onClick={() => removeIntolerance(i)} className="text-cr-red">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </CRCard>

      <CRCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-cr-charcoal">Current Medications</h2>
          <button type="button" onClick={() => addMed({ name: "", dosage: "", frequency: "", route: "", prescriber: "" })} className="flex items-center gap-1.5 text-sm text-cr-forest">
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="space-y-3">
          {medFields.map((f, i) => (
            <div key={f.id} className="p-3 bg-gray-50 rounded-xl">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { p: "Medication name *", n: `medications.${i}.name` },
                  { p: "Dosage", n: `medications.${i}.dosage` },
                  { p: "Frequency", n: `medications.${i}.frequency` },
                  { p: "Route (oral/topical...)", n: `medications.${i}.route` },
                  { p: "Prescriber", n: `medications.${i}.prescriber` },
                ].map(({ p, n }) => (
                  <input
                    key={n}
                    {...register(n as `medications.${number}.name`)}
                    placeholder={p}
                    className="px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
                  />
                ))}
                <button type="button" onClick={() => removeMed(i)} className="text-cr-red flex items-center gap-1 text-xs">
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
          {medFields.length === 0 && <p className="text-sm text-cr-slate">No medications added</p>}
        </div>
      </CRCard>

      <CRCard>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-4">Care Requirements</h2>
        <div className="space-y-4">
          {[
            { label: "Mobility needs", name: "mobility_needs", placeholder: "e.g. uses walking frame, needs assistance with transfers..." },
            { label: "Physical care needs", name: "physical_needs", placeholder: "e.g. restricted right-hand movement..." },
            { label: "Mental capacity notes", name: "mental_capacity_notes", placeholder: "e.g. has capacity for all decisions, lacks capacity for financial decisions..." },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">{f.label}</label>
              <textarea
                {...register(f.name as keyof FormData)}
                rows={2}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
              />
            </div>
          ))}
        </div>
      </CRCard>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200"><p className="text-xs text-cr-red">{error}</p></div>}

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="cr-btn-secondary px-6 py-3 text-sm">← Back</button>
        <button type="submit" disabled={loading} className="cr-btn-primary flex items-center gap-2 px-6 py-3">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Saving..." : "Continue to Care Needs →"}
        </button>
      </div>
    </form>
  );
}
