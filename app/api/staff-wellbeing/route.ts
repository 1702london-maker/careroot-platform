import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { staff_id, check_type, wellbeing_status, notes } = await req.json();
  if (!staff_id || !check_type || !wellbeing_status) {
    return NextResponse.json({ error: "staff_id, check_type, wellbeing_status required" }, { status: 400 });
  }

  const flaggedForManager = wellbeing_status === "distressed" || wellbeing_status === "concerned";

  const { data, error } = await supabase.from("staff_wellbeing_checks").insert({
    staff_id, check_type, wellbeing_status,
    notes: notes || null,
    flagged_for_manager: flaggedForManager,
    server_timestamp: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ check: data });
}
