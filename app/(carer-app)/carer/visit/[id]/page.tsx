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

  const { data: { user } } = await supabase.auth.getUser();
  const { data: userRecord } = await supabase.from("users").select("role, organisation_id").eq("id", user!.id).single();

  // ── Shift-based access guard ────────────────────────────────────────────────
  // Admins/managers/coordinators always have access
  const isAdmin = ["org_admin", "superadmin", "manager", "coordinator"].includes(userRecord?.role ?? "");

  if (!isAdmin) {
    const now = new Date();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const { data: activeShift } = await supabase
      .from("shifts")
      .select("id, status, actual_end, scheduled_end, client_ids")
      .eq("staff_id", user!.id)
      .in("status", ["active", "completed"])
      .gte("scheduled_end", thirtyMinsAgo.toISOString())
      .limit(10);

    const hasAccess = activeShift?.some(shift => {
      const ended = shift.actual_end || shift.scheduled_end;
      const endTime = new Date(ended).getTime();
      const withinWindow = shift.status === "active" || endTime >= thirtyMinsAgo.getTime();
      const clientOnShift = (shift.client_ids ?? []).includes(String(client.id));
      return withinWindow && clientOnShift;
    });

    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-2">Access Restricted</h2>
          <p className="text-sm text-cr-slate max-w-xs">
            You can only view client information during an active shift for this client, or up to 30 minutes after your shift ends.
          </p>
          <a href="/carer" className="cr-btn-primary mt-6 px-6 py-2.5">Back to Home</a>
        </div>
      );
    }
  }

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
      client_id: String(client.id),
      carer_id: user!.id,
      visit_id: id,
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
    />
  );
}
