"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { Plus, Trash2, Loader2 } from "lucide-react";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  date_of_birth: z.string().min(1, "Required"),
  nhs_number: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address_line1: z.string().min(1, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().min(1, "Postcode is required"),
  cultural_background: z.string().optional(),
  language_preferences: z.string().optional(),
  communication_needs: z.string().optional(),
  gp_name: z.string().min(1, "GP name is required"),
  gp_surgery: z.string().optional(),
  gp_phone: z.string().min(1, "GP phone is required"),
  gp_email: z.string().optional(),
  // Power of Attorney
  poa_name: z.string().optional(),
  poa_relationship: z.string().optional(),
  poa_phone: z.string().optional(),
  poa_email: z.string().email().optional().or(z.literal("")),
  poa_type: z.string().optional(),
  // Care plan recipient
  care_plan_recipient_name: z.string().optional(),
  care_plan_recipient_email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  care_plan_recipient_relationship: z.string().optional(),
  emergency_contacts: z.array(z.object({
    name: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().optional(),
  })).default([]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onComplete: (data: FormData, clientId: string) => void;
}

export function StepPersonalDetails({ onComplete }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { emergency_contacts: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "emergency_contacts" });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userRecord } = await supabase.from("users")
        .select("organisation_id").eq("id", user!.id).single();

      const { data: client, error: err } = await supabase.from("clients").insert({
        organisation_id: userRecord?.organisation_id,
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        nhs_number: data.nhs_number,
        phone: data.phone,
        email: data.email,
        address: {
          line1: data.address_line1,
          line2: data.address_line2,
          city: data.city,
          postcode: data.postcode,
        },
        cultural_background: data.cultural_background,
        language_preferences: data.language_preferences,
        communication_needs: data.communication_needs,
        gp_details: {
          name: data.gp_name,
          surgery: data.gp_surgery,
          phone: data.gp_phone,
          email: data.gp_email,
        },
        power_of_attorney: data.poa_name ? {
          name: data.poa_name,
          relationship: data.poa_relationship,
          phone: data.poa_phone,
          email: data.poa_email,
          type: data.poa_type,
        } : null,
        care_plan_recipient: data.care_plan_recipient_email ? {
          name: data.care_plan_recipient_name,
          email: data.care_plan_recipient_email,
          relationship: data.care_plan_recipient_relationship,
        } : null,
        emergency_contact: data.emergency_contacts,
        onboarding_step: 2,
        status: "active",
        risk_level: "low",
      }).select().single();

      if (err || !client) {
        setError(err?.message || "Failed to save");
        return;
      }

      onComplete(data, client.id);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label,
    name,
    type = "text",
    required = false,
    placeholder,
  }: {
    label: string;
    name: keyof FormData;
    type?: string;
    required?: boolean;
    placeholder?: string;
  }) => (
    <div>
      <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">
        {label}{required && <span className="text-cr-red ml-1">*</span>}
      </label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest"
      />
      {errors[name] && (
        <p className="mt-1 text-xs text-cr-red">{String((errors[name] as { message?: string })?.message)}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <CRCard>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-5">Personal Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="First name" name="first_name" required />
          <Field label="Last name" name="last_name" required />
          <Field label="Date of birth" name="date_of_birth" type="date" required />
          <Field label="NHS number" name="nhs_number" placeholder="e.g. 485 777 3456" />
          <Field label="Phone number" name="phone" type="tel" />
          <Field label="Email address" name="email" type="email" />
        </div>
      </CRCard>

      <CRCard>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-5">Home Address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Field label="Address line 1" name="address_line1" required placeholder="House number and street name" /></div>
          <div className="md:col-span-2"><Field label="Address line 2" name="address_line2" placeholder="Flat, apartment, floor (optional)" /></div>
          <Field label="City / Town" name="city" />
          <Field label="Postcode" name="postcode" required placeholder="e.g. SW1A 1AA" />
        </div>
      </CRCard>

      <CRCard>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-5">GP Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="GP name" name="gp_name" required placeholder="e.g. Dr Sarah Thompson" />
          <Field label="Surgery / practice name" name="gp_surgery" placeholder="e.g. Elm Park Surgery" />
          <Field label="GP phone" name="gp_phone" type="tel" required placeholder="e.g. 020 7123 4567" />
          <Field label="GP email" name="gp_email" type="email" placeholder="optional" />
        </div>
      </CRCard>

      <CRCard>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-2">Power of Attorney</h2>
        <p className="text-xs text-cr-slate mb-4">If a Lasting Power of Attorney (LPA) is in place, record the details here. Leave blank if none.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="PoA holder name" name="poa_name" placeholder="Full legal name" />
          <Field label="Relationship to service user" name="poa_relationship" placeholder="e.g. Daughter, Son, Solicitor" />
          <Field label="PoA contact phone" name="poa_phone" type="tel" />
          <Field label="PoA contact email" name="poa_email" type="email" />
          <div className="md:col-span-2">
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Type of LPA</label>
            <select {...register("poa_type")} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cr-forest/30">
              <option value="">Select type</option>
              <option value="health_welfare">Health & Welfare LPA</option>
              <option value="property_financial">Property & Financial Affairs LPA</option>
              <option value="both">Both Health & Welfare AND Property & Financial</option>
              <option value="court_appointed">Court of Protection — Deputy</option>
            </select>
          </div>
        </div>
      </CRCard>

      <CRCard>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-2">Care Plan Recipient</h2>
        <CRAlertBanner
          variant="blue"
          title="Who should receive the completed care plan?"
          description="The finalised care plan will be sent to this person by email once a manager approves it. This is typically the next of kin or the PoA holder."
          className="mb-4"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Recipient name" name="care_plan_recipient_name" placeholder="Full name" />
          <Field label="Recipient email" name="care_plan_recipient_email" type="email" placeholder="Email address for care plan delivery" />
          <Field label="Relationship to service user" name="care_plan_recipient_relationship" placeholder="e.g. Daughter, Next of kin" />
        </div>
      </CRCard>

      <CRCard>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-5">Communication & Culture</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Cultural background" name="cultural_background" placeholder="e.g. Nigerian, British Jamaican, British Indian..." />
          <Field label="Languages spoken" name="language_preferences" placeholder="e.g. English, Yoruba, Bengali..." />
          <div className="md:col-span-2">
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Communication needs</label>
            <textarea
              {...register("communication_needs")}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest"
              placeholder="e.g. hard of hearing, needs large print, prefers short sentences, uses Makaton, non-verbal..."
            />
          </div>
        </div>
      </CRCard>

      <CRCard>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold text-cr-charcoal">Emergency Contacts</h2>
          <button
            type="button"
            onClick={() => append({ name: "", relationship: "", phone: "", email: "" })}
            className="flex items-center gap-1.5 text-sm font-body text-cr-forest hover:text-cr-sage"
          >
            <Plus size={16} /> Add contact
          </button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm font-body text-cr-slate">No emergency contacts added yet.</p>
        ) : (
          <div className="space-y-4">
            {fields.map((field, i) => (
              <div key={field.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: "Full name", n: `emergency_contacts.${i}.name` },
                    { l: "Relationship", n: `emergency_contacts.${i}.relationship` },
                    { l: "Phone", n: `emergency_contacts.${i}.phone` },
                    { l: "Email (optional)", n: `emergency_contacts.${i}.email` },
                  ].map(({ l, n }) => (
                    <div key={n}>
                      <label className="block text-xs font-body font-medium text-cr-charcoal mb-1">{l}</label>
                      <input
                        {...register(n as `emergency_contacts.${number}.name`)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="mt-2 flex items-center gap-1 text-xs text-cr-red hover:text-red-700"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </CRCard>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200"><p className="text-xs text-cr-red">{error}</p></div>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="cr-btn-primary flex items-center gap-2 px-6 py-3"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Saving..." : "Continue to Medical Info →"}
        </button>
      </div>
    </form>
  );
}
