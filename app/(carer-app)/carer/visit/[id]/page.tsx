import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VisitActiveScreen } from "@/components/carer/VisitActiveScreen";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VisitPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: visit, error } = await supabase
    .from("visits")
    .select(`
      *,
      clients(
        id, first_name, last_name, date_of_birth, nhs_number,
        dnr_status, risk_level, allergies, care_needs,
        communication_needs, emergency_contact, gp_details,
        photo_url, address
      )
    `)
    .eq("id", id)
    .single();

  if (error || !visit) notFound();

  const client = visit.clients as Record<string, unknown>;

  // Fetch active care plan if user has access
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userRecord } = await supabase.from("users").select("role").eq("id", user!.id).single();

  const { data: carePlan } = await supabase
    .from("care_plans")
    .select("*")
    .eq("client_id", String(client.id))
    .eq("status", "active")
    .single();

  // Log care plan view for CQC evidence
  if (carePlan) {
    await supabase.from("care_plan_views").insert({
      care_plan_id: carePlan.id,
      viewed_by: user!.id,
      view_type: "carer_visit",
    }).then(() => {});
  }

  const [{ data: medications }, { data: mealPreferences }, { data: nutritionProfile }] = await Promise.all([
    supabase.from("medications").select("*").eq("client_id", String(client.id)).eq("is_active", true),
    supabase.from("meal_preferences").select("*").eq("client_id", String(client.id)),
    supabase.from("nutrition_profiles").select("*").eq("client_id", String(client.id)).single(),
  ]);

  return (
    <VisitActiveScreen
      visit={visit}
      client={client}
      carePlan={carePlan}
      medications={medications || []}
      mealPreferences={mealPreferences || []}
      nutritionProfile={nutritionProfile}
      carerRole={userRecord?.role || "carer"}
    />
  );
}
