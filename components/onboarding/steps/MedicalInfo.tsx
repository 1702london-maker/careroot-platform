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
    name: z.string().min(1, "Medication name is required"),
    dosage: z.string().min(1, "Dosage is required"),
    frequency: z.string().min(1, "Frequency is required"),
    time_to_take: z.string().min(1, "Time(s) to take is required"),
    route: z.string().optional(),
    prescriber: z.string().optional(),
    prescriber_contact: z.string().optional(),
    specific_rules: z.string().optional(),
    refill_threshold: z.string().optional(),
    pharmacy_name: z.string().optional(),
    pharmacy_phone: z.string().optional(),
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

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
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

      await supabase.from("clients").update({
        dnr_status: data.dnr_status,
        notes: [data.mobility_needs, data.physical_needs, data.mental_capacity_notes].filter(Boolean).join("\n"),
        onboarding_step: 3,
      }).eq("id", clientId);

      for (const med of data.medications) {
        if (med.name) {
          await supabase.from("medications").insert({
            client_id: clientId,
            organisation_id: userRecord?.organisation_id,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            time_to_take: med.time_to_take,
            route: med.route,
            prescriber: med.prescriber,
            prescriber_contact: med.prescriber_contact,
            specific_rules: med.specific_rules,
            refill_threshold: med.refill_threshold,
            pharmacy_name: med.pharmacy_name,
            pharmacy_phone: med.pharmacy_phone,
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

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30";
  const inputErrCls = "w-full px-3 py-2 rounded-lg border border-red-300 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-red/30";

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
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-4">DNR Status</h2>
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
                placeholder="e.g. Type 2 Diabetes, Dementia, Parkinson's..."
                className={inputCls}
              />
              <button type="button" onClick={() => removeCondition(i)} className="text-cr-red"><Trash2 size={16} /></button>
            </div>
          ))}
          {conditionFields.length === 0 && <p className="text-sm text-cr-slate">No conditions added</p>}
        </div>
      </CRCard>

      <CRCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-cr-charcoal">Known Allergies</h2>
          <button type="button" onClick={() => addAllergy({ name: "", severity: "mild" })} className="flex items-center gap-1.5 text-sm text-cr-forest">
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="space-y-3">
          {allergyFields.map((f, i) => (
            <div key={f.id} className="p-3 bg-red-50 rounded-xl border border-red-200">
              <div className="grid grid-cols-3 gap-2">
                <input {...register(`allergies.${i}.name`)} placeholder="Allergy name" className="px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none" />
                <select {...register(`allergies.${i}.severity`)} className="px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-white">
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="anaphylactic">Anaphylactic ⚠️</option>
                </select>
                <div className="flex gap-2">
                  <input {...register(`allergies.${i}.description`)} placeholder="Notes (optional)" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none" />
                  <button type="button" onClick={() => removeAllergy(i)} className="text-cr-red"><Trash2 size={16} /></button>
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
              <input {...register(`intolerances.${i}.name`)} placeholder="e.g. Lactose, Gluten..." className={inputCls} />
              <button type="button" onClick={() => removeIntolerance(i)} className="text-cr-red"><Trash2 size={16} /></button>
            </div>
          ))}
          {intoleranceFields.length === 0 && <p className="text-sm text-cr-slate">None recorded</p>}
        </div>
      </CRCard>

      {/* Medications — full MAR-linked detail */}
      <CRCard>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-display text-xl font-semibold text-cr-charcoal">Current Medications</h2>
            <p className="text-xs text-cr-slate mt-0.5">All fields feed directly into the MAR chart and care plan. Complete as fully as possible.</p>
          </div>
          <button
            type="button"
            onClick={() => addMed({ name: "", dosage: "", frequency: "", time_to_take: "", route: "", prescriber: "", prescriber_contact: "", specific_rules: "", refill_threshold: "", pharmacy_name: "", pharmacy_phone: "" })}
            className="flex items-center gap-1.5 text-sm text-cr-forest whitespace-nowrap"
          >
            <Plus size={16} /> Add medication
          </button>
        </div>

        {medFields.length === 0 && <p className="text-sm text-cr-slate mt-3">No medications added</p>}

        <div className="space-y-5 mt-3">
          {medFields.map((f, i) => {
            const medErr = (errors.medications as (Record<string, { message?: string }> | undefined)[] | undefined)?.[i];
            return (
              <div key={f.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cr-charcoal uppercase tracking-wide">Medication {i + 1}</span>
                  <button type="button" onClick={() => removeMed(i)} className="flex items-center gap-1 text-xs text-cr-red">
                    <Trash2 size={13} /> Remove
                  </button>
                </div>

                {/* Row 1: name, dosage, frequency */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-cr-charcoal mb-1">Medication name <span className="text-cr-red">*</span></label>
                    <input {...register(`medications.${i}.name`)} placeholder="e.g. Metformin 500mg" className={medErr?.name ? inputErrCls : inputCls} />
                    {medErr?.name && <p className="mt-1 text-xs text-cr-red">{medErr.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cr-charcoal mb-1">Dosage <span className="text-cr-red">*</span></label>
                    <input {...register(`medications.${i}.dosage`)} placeholder="e.g. 500mg, 10ml" className={medErr?.dosage ? inputErrCls : inputCls} />
                    {medErr?.dosage && <p className="mt-1 text-xs text-cr-red">{medErr.dosage.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cr-charcoal mb-1">Frequency <span className="text-cr-red">*</span></label>
                    <input {...register(`medications.${i}.frequency`)} placeholder="e.g. Twice daily, Once at night" className={medErr?.frequency ? inputErrCls : inputCls} />
                    {medErr?.frequency && <p className="mt-1 text-xs text-cr-red">{medErr.frequency.message}</p>}
                  </div>
                </div>

                {/* Row 2: time_to_take, route */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-cr-charcoal mb-1">Time(s) to take <span className="text-cr-red">*</span></label>
                    <input {...register(`medications.${i}.time_to_take`)} placeholder="e.g. 08:00, 13:00, 20:00" className={medErr?.time_to_take ? inputErrCls : inputCls} />
                    {medErr?.time_to_take && <p className="mt-1 text-xs text-cr-red">{medErr.time_to_take.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cr-charcoal mb-1">Route of administration</label>
                    <select {...register(`medications.${i}.route`)} className={inputCls}>
                      <option value="">Select route</option>
                      <option value="oral">Oral (swallowed)</option>
                      <option value="sublingual">Sublingual (under tongue)</option>
                      <option value="topical">Topical (skin)</option>
                      <option value="inhaled">Inhaled</option>
                      <option value="injection">Injection</option>
                      <option value="patch">Transdermal patch</option>
                      <option value="eye_drops">Eye drops</option>
                      <option value="ear_drops">Ear drops</option>
                      <option value="nasal">Nasal spray</option>
                      <option value="rectal">Rectal</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: specific rules */}
                <div>
                  <label className="block text-xs font-medium text-cr-charcoal mb-1">Specific rules / instructions</label>
                  <input {...register(`medications.${i}.specific_rules`)} placeholder="e.g. Must be taken with food, Do not crush, Take 30 mins before eating, Avoid grapefruit juice..." className={inputCls} />
                </div>

                {/* Row 4: prescriber, prescriber contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-cr-charcoal mb-1">Prescribing doctor / consultant</label>
                    <input {...register(`medications.${i}.prescriber`)} placeholder="e.g. Dr Amara Osei" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cr-charcoal mb-1">Prescriber contact number</label>
                    <input {...register(`medications.${i}.prescriber_contact`)} placeholder="e.g. 020 7123 4567" className={inputCls} type="tel" />
                  </div>
                </div>

                {/* Row 5: refill, pharmacy */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div>
                    <label className="block text-xs font-medium text-cr-charcoal mb-1">Refill when supply drops to</label>
                    <input {...register(`medications.${i}.refill_threshold`)} placeholder="e.g. 7 days supply remaining" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cr-charcoal mb-1">Dispensing pharmacy</label>
                    <input {...register(`medications.${i}.pharmacy_name`)} placeholder="e.g. Boots Pharmacy, High Street" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cr-charcoal mb-1">Pharmacy phone</label>
                    <input {...register(`medications.${i}.pharmacy_phone`)} placeholder="e.g. 020 8123 4567" className={inputCls} type="tel" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CRCard>

      <CRCard>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-4">Care Requirements</h2>
        <div className="space-y-4">
          {[
            { label: "Mobility needs", name: "mobility_needs", placeholder: "e.g. uses walking frame, requires 2 carers for transfers, falls risk..." },
            { label: "Physical care needs", name: "physical_needs", placeholder: "e.g. restricted right-hand movement, pressure area care required twice daily..." },
            { label: "Mental capacity notes", name: "mental_capacity_notes", placeholder: "e.g. has capacity for all day-to-day decisions, lacks capacity for financial/medical decisions per MCA 2005 assessment dated..." },
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
