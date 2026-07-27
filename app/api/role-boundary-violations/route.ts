import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { verifyActiveShiftAccess } from "@/lib/active-shift-guard";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, client_id, requested_task, requested_by, worker_response, imei } = await req.json();
  if (!shift_id || !requested_task || !requested_by || !worker_response) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const access = await verifyActiveShiftAccess(supabase, {
    userId: user.id,
    shiftId: shift_id,
    clientId: client_id || null,
    imei,
  });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const { data, error } = await supabase.from("role_boundary_violations").insert({
    shift_id, client_id: client_id || null, staff_id: user.id,
    requested_task, requested_by, worker_response,
    server_timestamp: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ violation: data });
}
