import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, client_id, concern_description, bypass_line_manager, gps_lat, gps_lng } = await req.json();
  if (!shift_id || !client_id || !concern_description) {
    return NextResponse.json({ error: "shift_id, client_id, concern_description required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase.from("safeguarding_concerns").insert({
    shift_id, client_id, staff_id: user.id,
    concern_description,
    bypass_line_manager: bypass_line_manager ?? false,
    notified_safeguarding_lead_at: now,
    notified_manager_at: bypass_line_manager ? null : now,
    gps_lat: gps_lat ?? null, gps_lng: gps_lng ?? null,
    server_timestamp: now,
    status: "open",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ concern: data });
}
