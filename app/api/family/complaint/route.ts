import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateComplaintReference } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client_id, complainant_name, complainant_email, complainant_phone, complaint_type, description, priority } = body;
    if (!description || !client_id) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

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

    const reference = generateComplaintReference();
    const { error } = await supabase.from("complaints").insert({
      organisation_id: access.organisation_id,
      client_id,
      complainant_name,
      complainant_email,
      complainant_phone,
      complaint_type: complaint_type ?? "other",
      description,
      priority: priority ?? "medium",
      date_received: new Date().toISOString().slice(0, 10),
      target_resolution_date: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      status: "received",
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, reference });
  } catch (err) {
    console.error("family complaint error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
