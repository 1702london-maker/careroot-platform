import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, client_id, mood_term, mood_category, context_notes, triggers_activated } = await req.json();
  if (!shift_id || !client_id || !mood_term) {
    return NextResponse.json({ error: "shift_id, client_id, mood_term required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("mood_records").insert({
    shift_id, client_id, staff_id: user.id,
    mood_term, mood_category: mood_category || null,
    context_notes: context_notes || null,
    triggers_activated: triggers_activated ?? false,
    server_timestamp: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}
