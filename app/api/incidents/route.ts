import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notify, messages } from "@/lib/notifications";
import { verifyActiveShiftAccess } from "@/lib/active-shift-guard";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { shift_id, client_id, incident_type, antecedent, antecedent_trigger, behaviour_description,
    consequence_description, physical_intervention_occurred, pi_technique, pi_duration_minutes,
    deescalation_strategies_used, staff_wellbeing_checked, gps_lat, gps_lng, imei } = body;

  if (!shift_id || !client_id || !behaviour_description) {
    return NextResponse.json({ error: "shift_id, client_id, behaviour_description required" }, { status: 400 });
  }

  const access = await verifyActiveShiftAccess(supabase, {
    userId: user.id,
    shiftId: shift_id,
    clientId: client_id,
    imei,
    gpsLat: gps_lat ?? null,
    gpsLng: gps_lng ?? null,
  });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const now = new Date().toISOString();
  const wellbeingCheckDue = physical_intervention_occurred
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase.from("incidents").insert({
    shift_id, client_id, staff_id: user.id,
    incident_type: incident_type || "behaviour",
    antecedent: antecedent || null, antecedent_trigger: antecedent_trigger || null,
    behaviour_description, consequence_description: consequence_description || null,
    physical_intervention_occurred: physical_intervention_occurred ?? false,
    pi_technique: pi_technique || null, pi_duration_minutes: pi_duration_minutes ?? null,
    deescalation_strategies_used: deescalation_strategies_used || [],
    staff_wellbeing_checked: staff_wellbeing_checked ?? false,
    staff_wellbeing_check_due: wellbeingCheckDue,
    gps_lat: gps_lat ?? null, gps_lng: gps_lng ?? null,
    notified_manager_at: now,
    server_timestamp: now,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Dual notification — manager + safeguarding lead simultaneously (B12).
  const { data: me } = await supabase
    .from("users").select("first_name, last_name").eq("id", user.id).single();
  if (access.organisationId) {
    const staffName = me ? `${me.first_name} ${me.last_name}` : "A worker";
    await notify(supabase, {
      organisationId: access.organisationId,
      recipientGroups: ["manager", "safeguarding_lead"],
      message: messages.incidentLogged(
        incident_type || "behaviour",
        access.clientName,
        now,
        staffName
      ),
    });
  }

  return NextResponse.json({ incident: data });
}
