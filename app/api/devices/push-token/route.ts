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

  let query = supabase
    .from("registered_devices")
    .update({
      push_token,
      push_token_updated_at: new Date().toISOString(),
    })
    .eq("staff_id", user.id)
    .eq("is_active", true);

  if (device_id && typeof device_id === "string") {
    query = query.eq("imei", device_id.replace(/\s/g, ""));
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
