import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { shift_id, client_id, log_type, content, gps_lat, gps_lng, within_approved_radius } = body;
  if (!shift_id || !log_type || !content) return NextResponse.json({ error: "shift_id, log_type, content required" }, { status: 400 });

  const { data, error } = await supabase.from("shift_logs").insert({
    shift_id, client_id: client_id || null, staff_id: user.id,
    log_type, content,
    gps_lat: gps_lat ?? null, gps_lng: gps_lng ?? null,
    within_approved_radius: within_approved_radius ?? null,
    server_timestamp: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log: data });
}
