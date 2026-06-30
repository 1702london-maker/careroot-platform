import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, client_id, task_name, is_authorised, notes } = await req.json();
  if (!shift_id || !task_name || is_authorised === undefined) {
    return NextResponse.json({ error: "shift_id, task_name, is_authorised required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("task_completions").insert({
    shift_id, client_id: client_id || null, staff_id: user.id,
    task_name, is_authorised, notes: notes || null,
    server_timestamp: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
