import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { client_id, requester_name, requester_email, reason } = await req.json();
    if (!client_id) return NextResponse.json({ error: "Missing client" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { data: access } = await supabase
      .from("family_access")
      .select("id, organisation_id")
      .eq("user_id", user.id)
      .eq("client_id", client_id)
      .eq("is_active", true)
      .single();
    if (!access?.organisation_id) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { error } = await supabase.from("sar_requests").insert({
      organisation_id: access.organisation_id,
      client_id,
      requester_name, requester_email,
      reason: reason || null,
      requested_by: user.id,
      status: "pending",
      due_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("family sar error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
