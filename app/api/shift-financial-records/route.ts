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
  const { shift_id, client_id, commissioned_hours, hourly_rate, mileage_claimed_miles, travel_time_minutes } = body;
  if (!shift_id || commissioned_hours == null || hourly_rate == null) {
    return NextResponse.json({ error: "shift_id, commissioned_hours, hourly_rate required" }, { status: 400 });
  }

  // Verify shift belongs to org
  const { data: shift } = await supabase.from("shifts").select("organisation_id, staff_id, actual_start, actual_end").eq("id", shift_id).single();
  if (!shift || shift.organisation_id !== caller!.organisation_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Auto-derive actual hours from the shift's recorded start/end (B19).
  let actualHours: number | null = null;
  if (shift.actual_start && shift.actual_end) {
    actualHours = (new Date(shift.actual_end).getTime() - new Date(shift.actual_start).getTime()) / 3600000;
    actualHours = Math.round(actualHours * 100) / 100;
  }

  // Bill on actual hours where available, else commissioned. Mileage at £0.45/mi.
  const billHours = actualHours ?? Number(commissioned_hours);
  const mileage = Number(mileage_claimed_miles || 0);
  const billableAmount = Math.round((billHours * Number(hourly_rate) + mileage * 0.45) * 100) / 100;

  const { data, error } = await supabase.from("shift_financial_records").insert({
    shift_id,
    client_id: client_id || null,
    staff_id: shift.staff_id,
    commissioned_hours: Number(commissioned_hours),
    actual_hours: actualHours,
    travel_time_minutes: travel_time_minutes ?? null,
    mileage_claimed_miles: mileage || null,
    mileage_claimed_at: mileage ? new Date().toISOString() : null,
    billable_amount: billableAmount,
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
