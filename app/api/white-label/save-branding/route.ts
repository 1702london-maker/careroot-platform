import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id, role").eq("id", user.id).single();
  if (userRecord?.role !== "org_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = [
    "wl_app_name", "wl_logo_url", "wl_primary_colour", "wl_secondary_colour",
    "wl_accent_colour", "wl_email_from", "wl_support_email", "wl_play_store_url", "wl_app_store_url",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { error } = await supabase
    .from("organisations")
    .update(update)
    .eq("id", userRecord.organisation_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
