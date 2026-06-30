import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, client_id, requested_task, requested_by, worker_response } = await req.json();
  if (!shift_id || !requested_task || !requested_by || !worker_response) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("role_boundary_violations").insert({
    shift_id, client_id: client_id || null, staff_id: user.id,
    requested_task, requested_by, worker_response,
    server_timestamp: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ violation: data });
}
