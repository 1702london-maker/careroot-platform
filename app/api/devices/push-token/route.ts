import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { push_token, device_id } = await req.json().catch(() => ({}));
  if (!push_token || typeof push_token !== "string") {
    return NextResponse.json({ error: "push_token required" }, { status: 400 });
  }

  const imei = device_id && typeof device_id === "string" ? device_id.replace(/\s/g, "") : null;
  const now = new Date().toISOString();

  // Build the match condition — must match staff + active device
  let matchQuery = supabase
    .from("registered_devices")
    .update({ push_token, push_token_updated_at: now })
    .eq("staff_id", user.id)
    .eq("is_active", true);

  if (imei) matchQuery = matchQuery.eq("imei", imei);

  const { error, count } = await matchQuery.select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If no active device matched, the carer's device may not be approved yet
  if (!count || count === 0) {
    return NextResponse.json(
      { error: "No active registered device found. Ask your manager to approve your device before push notifications can be enabled." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
