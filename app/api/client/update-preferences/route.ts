import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const {
      client_id,
      medications_summary,
      allergies,
      dietary_requirements,
      food_preferences,
      daily_routine,
      triggers,
      care_preferences,
      other_notes,
    } = await req.json();

    if (!client_id) return NextResponse.json({ error: "Missing client" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    // Verify this user is the client or has client_access to this client
    const { data: access } = await supabase
      .from("client_access")
      .select("id, organisation_id")
      .eq("user_id", user.id)
      .eq("client_id", client_id)
      .eq("is_active", true)
      .single();

    if (!access) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const lines: string[] = [];
    if (medications_summary) lines.push(`MEDICATIONS:\n${medications_summary}`);
    if (allergies) lines.push(`ALLERGIES / SENSITIVITIES:\n${allergies}`);
    if (dietary_requirements) lines.push(`DIETARY REQUIREMENTS:\n${dietary_requirements}`);
    if (food_preferences) lines.push(`FOOD PREFERENCES:\n${food_preferences}`);
    if (daily_routine) lines.push(`DAILY ROUTINE:\n${daily_routine}`);
    if (triggers) lines.push(`TRIGGERS / THINGS TO AVOID:\n${triggers}`);
    if (care_preferences) lines.push(`HOW I LIKE TO BE CARED FOR:\n${care_preferences}`);
    if (other_notes) lines.push(`OTHER NOTES:\n${other_notes}`);

    if (lines.length === 0) return NextResponse.json({ success: true });

    const { error } = await supabase.from("family_briefings").insert({
      client_id,
      organisation_id: access.organisation_id,
      content: `Client self-reported update — please review and update care records:\n\n${lines.join("\n\n")}`,
      generated_by: "client",
      created_at: new Date().toISOString(),
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("client update-preferences error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
