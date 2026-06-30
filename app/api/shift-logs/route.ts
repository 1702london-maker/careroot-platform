import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notify, messages } from "@/lib/notifications";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { shift_id, client_id, log_type, content, gps_lat, gps_lng, within_approved_radius } = body;
  if (!shift_id || !log_type || !content) return NextResponse.json({ error: "shift_id, log_type, content required" }, { status: 400 });

  const now = new Date().toISOString();

  // Per-request credential check (BUILD_SPEC system rules): reject if the
  // worker's shift credential window has expired or been invalidated.
  const { data: credential } = await supabase
    .from("shift_credentials")
    .select("valid_until, invalidated_at")
    .eq("shift_id", shift_id)
    .eq("staff_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!credential || credential.invalidated_at || now > credential.valid_until) {
    return NextResponse.json({ error: "Your shift access has expired. Ask a manager to re-authorise." }, { status: 401 });
  }

  // Server-side trigger-word detection against the care plan's trigger vocabulary.
  let triggersDetected: string[] = [];
  let organisationId: string | null = null;
  let clientName = "the client";
  if (client_id) {
    const { data: plan } = await supabase
      .from("care_plans")
      .select("trigger_vocabulary")
      .eq("client_id", client_id)
      .eq("is_current", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const vocab = (plan?.trigger_vocabulary as string[] | null) ?? [];
    const lower = String(content).toLowerCase();
    triggersDetected = vocab.filter((t) => t && lower.includes(String(t).toLowerCase()));

    if (triggersDetected.length) {
      const { data: client } = await supabase
        .from("clients").select("organisation_id, first_name, last_name").eq("id", client_id).single();
      organisationId = client?.organisation_id ?? null;
      if (client) clientName = `${client.first_name} ${client.last_name}`;
    }
  }

  const { data, error } = await supabase.from("shift_logs").insert({
    shift_id, client_id: client_id || null, staff_id: user.id,
    log_type, content,
    gps_lat: gps_lat ?? null, gps_lng: gps_lng ?? null,
    within_approved_radius: within_approved_radius ?? null,
    triggers_detected: triggersDetected.length ? triggersDetected : null,
    server_timestamp: now,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (triggersDetected.length && organisationId) {
    await notify(supabase, {
      organisationId,
      recipientGroups: ["manager"],
      message: messages.triggerActivated(clientName, triggersDetected.join(", ")),
    });
  }

  return NextResponse.json({ log: data, triggers_detected: triggersDetected });
}
