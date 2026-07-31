import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { FamilyPortalFullClient } from "@/components/family/FamilyPortalFullClient";

interface Props { params: Promise<{ clientId: string }> }

export default async function FamilyClientPage({ params }: Props) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/family/login");

  const { data: access } = await supabase
    .from("family_access")
    .select("*, clients(*)")
    .eq("user_id", user.id)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .single();

  if (!access) notFound();

  const { data: clientRecord } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  const accessLevel = String(access.access_level);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: recentVisits },
    { data: complaints },
    { data: briefings },
    { data: familyUser },
    { data: carePlan },
    { data: medicationSchedules },
    { data: medicationRecords },
    { data: nutritionRecords },
    { data: moodRecords },
    { data: consentRecords },
    { data: sarRequests },
  ] = await Promise.all([
    supabase.from("visits")
      .select("id, scheduled_start, scheduled_end, actual_start, actual_end, status, ai_summary")
      .eq("client_id", clientId)
      .order("scheduled_start", { ascending: false })
      .limit(30),
    accessLevel !== "limited"
      ? supabase.from("complaints")
          .select("id, description, status, complaint_type, category, created_at, priority")
          .eq("client_id", clientId)
          .eq("complainant_email", user.email)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from("family_briefings")
      .select("id, content, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("users").select("first_name, last_name, email, phone").eq("id", user.id).single(),
    supabase.from("care_plans")
      .select("id, status, review_date, created_at")
      .eq("client_id", clientId)
      .eq("is_current", true)
      .maybeSingle(),
    supabase.from("medication_schedules")
      .select("id, medication_name, dose, route, scheduled_times, is_prn, is_controlled, prescriber, start_date, current_stock")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .order("medication_name", { ascending: true }),
    supabase.from("medication_records")
      .select("id, status, scheduled_time, administered_at, refusal_reason, outcome_notes, created_at, medication_schedules(medication_name)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("nutrition_records")
      .select("id, meal_type, offered, consumed, concerns, fluid_intake_ml, server_timestamp")
      .eq("client_id", clientId)
      .gte("server_timestamp", thirtyDaysAgo)
      .order("server_timestamp", { ascending: false })
      .limit(30),
    supabase.from("mood_records")
      .select("id, mood_term, mood_category, context_notes, triggers_activated, server_timestamp")
      .eq("client_id", clientId)
      .gte("server_timestamp", thirtyDaysAgo)
      .order("server_timestamp", { ascending: false })
      .limit(30),
    supabase.from("consent_records")
      .select("id, consent_type, granted, granted_by, granted_at, withdrawn_at, notes, review_due")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase.from("sar_requests")
      .select("id, requester_name, request_date, deadline_date, status, data_provided_at, notes")
      .eq("client_id", clientId)
      .eq("requester_email", user.email)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <FamilyPortalFullClient
      client={(clientRecord ?? {}) as Record<string, unknown>}
      accessLevel={accessLevel}
      accessId={access.id}
      familyUser={familyUser}
      recentVisits={(recentVisits ?? []) as Record<string, unknown>[]}
      complaints={(complaints ?? []) as Record<string, unknown>[]}
      briefings={(briefings ?? []) as Record<string, unknown>[]}
      carePlan={(carePlan ?? null) as Record<string, unknown> | null}
      medicationSchedules={(medicationSchedules ?? []) as Record<string, unknown>[]}
      medicationRecords={(medicationRecords ?? []) as Record<string, unknown>[]}
      nutritionRecords={(nutritionRecords ?? []) as Record<string, unknown>[]}
      moodRecords={(moodRecords ?? []) as Record<string, unknown>[]}
      consentRecords={(consentRecords ?? []) as Record<string, unknown>[]}
      sarRequests={(sarRequests ?? []) as Record<string, unknown>[]}
    />
  );
}
