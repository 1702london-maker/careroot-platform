import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const {
      client_id,
      dietary_requirements,
      food_timetable,
      food_preferences,
      care_notes,
      medications_summary,
      allergies,
      daily_routine,
      triggers,
      care_preferences,
    } = await req.json();
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
    if (!access) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const noteLines = [];
    if (dietary_requirements) noteLines.push(`DIETARY REQUIREMENTS:\n${dietary_requirements}`);
    if (medications_summary) noteLines.push(`MEDICATION INFORMATION:\n${medications_summary}`);
    if (allergies) noteLines.push(`ALLERGIES:\n${allergies}`);
    if (food_timetable) noteLines.push(`MEAL TIMETABLE:\n${food_timetable}`);
    if (food_preferences) noteLines.push(`FOOD PREFERENCES:\n${food_preferences}`);
    if (daily_routine) noteLines.push(`DAILY ROUTINE:\n${daily_routine}`);
    if (triggers) noteLines.push(`TRIGGERS / THINGS TO AVOID:\n${triggers}`);
    if (care_preferences) noteLines.push(`CARE PREFERENCES:\n${care_preferences}`);
    if (care_notes) noteLines.push(`FAMILY CARE NOTES:\n${care_notes}`);

    if (noteLines.length > 0) {
      const { error } = await supabase.from("family_briefings").insert({
        client_id,
        organisation_id: access.organisation_id,
        content: `Family update submitted for manager review:\n\n${noteLines.join("\n\n")}`,
        generated_by: "family",
        created_at: new Date().toISOString(),
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("family update-care error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
