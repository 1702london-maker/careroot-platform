import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id").eq("id", user.id).single();

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "from and to required" }, { status: 400 });

  const { data: shifts, error } = await supabase
    .from("shifts")
    .select("id, staff_id, scheduled_start, scheduled_end, status, client_ids, service_lines(name)")
    .eq("organisation_id", userRecord?.organisation_id)
    .gte("scheduled_start", from)
    .lte("scheduled_start", to)
    .order("scheduled_start");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve client names for the first client in each shift
  const allClientIds = [...new Set((shifts ?? []).flatMap((s) => (s.client_ids as string[] | null) ?? []))];
  let clientMap: Record<string, { first_name: string; last_name: string }> = {};
  if (allClientIds.length) {
    const { data: clientRows } = await supabase
      .from("clients").select("id, first_name, last_name").in("id", allClientIds);
    for (const c of clientRows ?? []) clientMap[c.id] = c;
  }

  const enriched = (shifts ?? []).map((s) => {
    const firstId = (s.client_ids as string[] | null)?.[0];
    return { ...s, client: firstId ? clientMap[firstId] ?? null : null };
  });

  return NextResponse.json({ shifts: enriched });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id, role").eq("id", user.id).single();

  if (!["org_admin", "manager"].includes(userRecord?.role ?? "")) {
    return NextResponse.json({ error: "Only managers can create shifts" }, { status: 403 });
  }

  const body = await req.json();
  const { staff_id, client_id, service_line_id, scheduled_start, scheduled_end } = body;
  if (!staff_id || !scheduled_start || !scheduled_end) {
    return NextResponse.json({ error: "staff_id, scheduled_start, scheduled_end required" }, { status: 400 });
  }

  const { data: staffMember } = await supabase
    .from("users").select("id, organisation_id").eq("id", staff_id).single();
  if (staffMember?.organisation_id !== userRecord?.organisation_id) {
    return NextResponse.json({ error: "Staff member not in your organisation" }, { status: 403 });
  }

  const { data: shift, error } = await supabase
    .from("shifts")
    .insert({
      organisation_id: userRecord!.organisation_id,
      staff_id,
      client_ids: client_id ? [client_id] : [],
      service_line_id: service_line_id ?? null,
      scheduled_start,
      scheduled_end,
      status: "scheduled",
    })
    .select("id, staff_id, scheduled_start, scheduled_end, status, client_ids, service_lines(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return with client name
  let client = null;
  const firstId = (shift.client_ids as string[] | null)?.[0];
  if (firstId) {
    const { data: c } = await supabase.from("clients").select("first_name, last_name").eq("id", firstId).single();
    client = c;
  }

  return NextResponse.json({ shift: { ...shift, client } }, { status: 201 });
}
