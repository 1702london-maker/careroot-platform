"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { Plus, Trash2, Loader2 } from "lucide-react";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  date_of_birth: z.string().min(1, "Required"),
  nhs_number: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  cultural_background: z.string().optional(),
  language_preferences: z.string().optional(),
  communication_needs: z.string().optional(),
  gp_name: z.string().optional(),
  gp_surgery: z.string().optional(),
  gp_phone: z.string().optional(),
  gp_email: z.string().optional(),
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
    resolver: zodResolver(schema),
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

  const Field = ({ label, name, type = "text", required = false }: { label: string; name: keyof FormData; type?: string; required?: boolean }) => (
    <div>
      <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">
        {label}{required && <span className="text-cr-red ml-1">*</span>}
      </label>
      <input
        {...register(name as string)}
        type={type}
        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest"
      />
      {errors[name] && <p className="mt-1 text-xs text-cr-red">{String((errors[name] as { message?: string })?.message)}</p>}
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
          <Field label="NHS number" name="nhs_number" />
          <Field label="Phone number" name="phone" type="tel" />
          <Field label="Email address" name="email" type="email" />
        </div>
      </CRCard>

      <CRCard>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-5">Address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Field label="Address line 1" name="address_line1" /></div>
          <div className="md:col-span-2"><Field label="Address line 2" name="address_line2" /></div>
          <Field label="City" name="city" />
          <Field label="Postcode" name="postcode" />
        </div>
      </CRCard>

      <CRCard>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-5">Communication & Culture</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Cultural background" name="cultural_background" />
          <Field label="Languages spoken" name="language_preferences" />
          <div className="md:col-span-2">
            <label className="block text-sm font-body font-medium text-cr-charcoal mb-1">Communication needs</label>
            <textarea
              {...register("communication_needs")}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest"
              placeholder="e.g. hard of hearing, needs large print, prefers short sentences..."
            />
          </div>
        </div>
      </CRCard>

      <CRCard>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-5">GP Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="GP name" name="gp_name" />
          <Field label="Surgery name" name="gp_surgery" />
          <Field label="GP phone" name="gp_phone" type="tel" />
          <Field label="GP email" name="gp_email" type="email" />
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
