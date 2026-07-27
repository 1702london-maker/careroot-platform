import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ClientPortalClient } from "@/components/client/ClientPortalClient";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDashboardPage({ params }: Props) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/client/login");

  const { data: access } = await supabase
    .from("client_access")
    .select("*, clients(*)")
    .eq("user_id", user.id)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .single();

  if (!access) notFound();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: todayVisits },
    { data: recentVisits },
    { data: carePlan },
    { data: medicationSchedules },
    { data: medicationRecords },
    { data: nutritionRecords },
    { data: moodRecords },
    { data: consentRecords },
    { data: sarRequests },
    { data: complaints },
    { data: familyAccess },
  ] = await Promise.all([
    supabase.from("visits")
      .select("id, client_id, carer_id, scheduled_start, scheduled_end, actual_start, actual_end, status, notes, ai_summary, users(first_name, last_name)")
      .eq("client_id", clientId)
      .gte("scheduled_start", todayStart)
      .lt("scheduled_start", tomorrowStart)
      .order("scheduled_start", { ascending: true }),
    supabase.from("visits")
      .select("id, client_id, carer_id, scheduled_start, scheduled_end, actual_start, actual_end, status, notes, ai_summary, users(first_name, last_name)")
      .eq("client_id", clientId)
      .gte("scheduled_start", thirtyDaysAgo)
      .order("scheduled_start", { ascending: false })
      .limit(30),
    supabase.from("care_plans")
      .select("id, status, review_date, authorised_tasks, excluded_tasks, mood_vocabulary, trigger_vocabulary, created_at")
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
      .order("created_at", { ascending: false }),
    supabase.from("complaints")
      .select("id, category, complaint_type, description, desired_outcome, status, manager_response, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase.from("family_access")
      .select("id, relationship, access_level, users(first_name, last_name)")
      .eq("client_id", clientId)
      .eq("is_active", true),
  ]);

  return (
    <ClientPortalClient
      client={(access.clients ?? {}) as Record<string, unknown>}
      todayVisits={(todayVisits ?? []) as Record<string, unknown>[]}
      recentVisits={(recentVisits ?? []) as Record<string, unknown>[]}
      carePlan={(carePlan ?? null) as Record<string, unknown> | null}
      medicationSchedules={(medicationSchedules ?? []) as Record<string, unknown>[]}
      medicationRecords={(medicationRecords ?? []) as Record<string, unknown>[]}
      nutritionRecords={(nutritionRecords ?? []) as Record<string, unknown>[]}
      moodRecords={(moodRecords ?? []) as Record<string, unknown>[]}
      consentRecords={(consentRecords ?? []) as Record<string, unknown>[]}
      sarRequests={(sarRequests ?? []) as Record<string, unknown>[]}
      complaints={(complaints ?? []) as Record<string, unknown>[]}
      familyAccess={(familyAccess ?? []) as Record<string, unknown>[]}
      userEmail={user.email ?? null}
    />
  );
}
