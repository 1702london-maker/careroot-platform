import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notify } from "@/lib/notifications";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { staff_id, shift_id, check_type, wellbeing_status, notes } = await req.json();
  if (!staff_id || !check_type || !wellbeing_status) {
    return NextResponse.json({ error: "staff_id, check_type, wellbeing_status required" }, { status: 400 });
  }

  const { data: caller } = await supabase
    .from("users")
    .select("role, organisation_id, first_name, last_name")
    .eq("id", user.id)
    .single();
  const isManager = ["superadmin", "org_admin", "manager", "coordinator"].includes(caller?.role ?? "");
  if (staff_id !== user.id && !isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: target } = await supabase
    .from("users")
    .select("organisation_id, first_name, last_name")
    .eq("id", staff_id)
    .single();
  if (!target || (caller?.role !== "superadmin" && target.organisation_id !== caller?.organisation_id)) {
    return NextResponse.json({ error: "Staff member not found in your organisation" }, { status: 404 });
  }

  if (shift_id) {
    const { data: shift } = await supabase
      .from("shifts")
      .select("id, staff_id")
      .eq("id", shift_id)
      .eq("staff_id", staff_id)
      .maybeSingle();
    if (!shift) return NextResponse.json({ error: "Shift not found for this staff member" }, { status: 404 });
  }

  const flaggedForManager = wellbeing_status === "distressed" || wellbeing_status === "concerned";

  const { data, error } = await supabase.from("staff_wellbeing_checks").insert({
    staff_id, shift_id: shift_id || null, check_type, wellbeing_status,
    notes: notes || null,
    flagged_for_manager: flaggedForManager,
    server_timestamp: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (flaggedForManager && target.organisation_id) {
    const staffName = `${target.first_name ?? ""} ${target.last_name ?? ""}`.trim() || "A staff member";
    await notify(supabase, {
      organisationId: target.organisation_id,
      recipientGroups: ["manager"],
      message: `STAFF WELLBEING ALERT: ${staffName} reported ${wellbeing_status}. Manager follow-up required.`,
    });
  }
  return NextResponse.json({ check: data });
}
