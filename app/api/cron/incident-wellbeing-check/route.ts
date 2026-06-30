import { NextRequest, NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";
import { notify, messages } from "@/lib/notifications";

/**
 * Post-incident staff wellbeing check (BUILD_SPEC B21 / B12): 24 hours after a
 * physical-intervention incident, if no wellbeing check has been completed,
 * alert the manager. Ideally runs every 30 minutes (needs Vercel Pro).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClientSync();
  const now = new Date().toISOString();

  // Incidents needing a wellbeing follow-up: PI occurred, due time passed, not done.
  const { data: due } = await supabase
    .from("incidents")
    .select("id, staff_id, client_id, staff_wellbeing_check_due, staff_wellbeing_checked, client:clients(organisation_id)")
    .eq("physical_intervention_occurred", true)
    .eq("staff_wellbeing_checked", false)
    .lt("staff_wellbeing_check_due", now);

  let alerted = 0;
  for (const inc of due ?? []) {
    const orgId = (inc.client as unknown as { organisation_id: string } | null)?.organisation_id;
    if (!orgId || !inc.staff_id) continue;

    const { data: staff } = await supabase
      .from("users").select("first_name, last_name").eq("id", inc.staff_id).single();
    const staffName = staff ? `${staff.first_name} ${staff.last_name}` : "a staff member";

    await notify(supabase, {
      organisationId: orgId,
      recipientGroups: ["manager"],
      message: messages.postIncidentWellbeingDue(staffName),
    });
    alerted++;
  }

  return NextResponse.json({ ok: true, alerted });
}
