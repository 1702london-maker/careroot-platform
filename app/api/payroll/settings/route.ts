import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/session-user";

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(req: NextRequest) {
  const { supabase, user, error } = await requireSessionUser(["org_admin", "manager"]);
  if (error || !user) return error;

  const body = await req.json();
  const staffId = String(body.staff_id ?? body.user_id ?? "");
  if (!staffId) {
    return NextResponse.json({ error: "staff_id is required" }, { status: 400 });
  }

  const { data: staff } = await supabase
    .from("users")
    .select("id, organisation_id, role")
    .eq("id", staffId)
    .eq("organisation_id", user.organisation_id)
    .single();

  if (!staff) {
    return NextResponse.json({ error: "Staff member not found for your organisation" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];

  await supabase
    .from("carer_pay_rates")
    .update({ effective_to: today })
    .eq("user_id", staffId)
    .eq("organisation_id", user.organisation_id)
    .is("effective_to", null);

  const { data: rate, error: insertError } = await supabase
    .from("carer_pay_rates")
    .insert({
      organisation_id: user.organisation_id,
      user_id: staffId,
      hourly_rate: numberOrNull(body.hourly_rate) ?? 0,
      overtime_rate: numberOrNull(body.overtime_rate),
      weekend_rate: numberOrNull(body.weekend_rate),
      travel_rate_per_mile: numberOrNull(body.travel_rate_per_mile),
      effective_from: body.effective_from ?? today,
      effective_to: null,
    })
    .select()
    .single();

  if (insertError) {
    console.error("payroll settings save error:", insertError);
    return NextResponse.json({ error: "Failed to save pay settings" }, { status: 500 });
  }

  return NextResponse.json({ rate }, { status: 201 });
}
