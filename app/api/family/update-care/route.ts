import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { client_id, dietary_requirements, food_timetable, food_preferences, care_notes, medications_summary, allergies } = await req.json();
    if (!client_id) return NextResponse.json({ error: "Missing client" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    // Verify family has access to this client
    const { data: access } = await supabase.from("family_access")
      .select("id").eq("user_id", user.id).eq("client_id", client_id).eq("is_active", true).single();
    if (!access) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // Update client record
    const updatePayload: Record<string, unknown> = {};
    if (dietary_requirements !== undefined) updatePayload.dietary_requirements = dietary_requirements;
    if (medications_summary !== undefined) updatePayload.medications_summary = medications_summary;
    if (allergies !== undefined) {
      updatePayload.allergies = allergies ? allergies.split(",").map((a: string) => a.trim()).filter(Boolean) : [];
    }

    if (Object.keys(updatePayload).length > 0) {
      await supabase.from("clients").update(updatePayload).eq("id", client_id);
    }

    // Log the family update as a note for managers to review
    const noteLines = [];
    if (food_timetable) noteLines.push(`MEAL TIMETABLE:\n${food_timetable}`);
    if (food_preferences) noteLines.push(`FOOD PREFERENCES:\n${food_preferences}`);
    if (care_notes) noteLines.push(`FAMILY CARE NOTES:\n${care_notes}`);

    if (noteLines.length > 0) {
      await supabase.from("family_briefings").insert({
        client_id,
        content: `Family update submitted:\n\n${noteLines.join("\n\n")}`,
        generated_by: "family",
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("family update-care error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
