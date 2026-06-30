import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!["superadmin", "org_admin", "manager", "coordinator"].includes(caller?.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { shift_id, billable_hours, hourly_rate, travel_miles, travel_allowance_per_mile, additional_charges, notes } = body;
  if (!shift_id || !billable_hours || !hourly_rate) {
    return NextResponse.json({ error: "shift_id, billable_hours, hourly_rate required" }, { status: 400 });
  }

  // Verify shift belongs to org
  const { data: shift } = await supabase.from("shifts").select("organisation_id, staff_id, actual_start, actual_end").eq("id", shift_id).single();
  if (!shift || shift.organisation_id !== caller!.organisation_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const travelTotal = (travel_miles || 0) * (travel_allowance_per_mile || 0.45);
  const totalAmount = (billable_hours * hourly_rate) + travelTotal + (additional_charges || 0);

  const { data, error } = await supabase.from("shift_financial_records").insert({
    shift_id,
    staff_id: shift.staff_id,
    organisation_id: caller!.organisation_id,
    billable_hours: Number(billable_hours),
    hourly_rate: Number(hourly_rate),
    travel_miles: travel_miles || 0,
    travel_allowance_per_mile: travel_allowance_per_mile || 0.45,
    travel_total: travelTotal,
    additional_charges: additional_charges || 0,
    total_amount: totalAmount,
    notes: notes || null,
    created_by: user.id,
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  const url = new URL(req.url);
  const staffId = url.searchParams.get("staff_id");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let query = supabase.from("shift_financial_records")
    .select("*, staff:users!staff_id(id, first_name, last_name), shift:shifts(scheduled_start, actual_start, actual_end, status)")
    .eq("organisation_id", caller!.organisation_id)
    .order("created_at", { ascending: false });

  if (staffId) query = query.eq("staff_id", staffId);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data });
}
