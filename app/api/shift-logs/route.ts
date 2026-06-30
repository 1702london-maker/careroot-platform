import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notify, messages } from "@/lib/notifications";
import { withinApprovedRadius } from "@/lib/geo";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  // Note: any client-supplied within_approved_radius is ignored — computed server-side below.
  const { shift_id, client_id, log_type, content, gps_lat, gps_lng } = body;
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

  // Fetch the client once for GPS radius check + trigger vocabulary + naming.
  let triggersDetected: string[] = [];
  let organisationId: string | null = null;
  let clientName = "the client";
  let radiusResult: boolean | null = null;
  if (client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("organisation_id, first_name, last_name, gps_lat, gps_lng, approved_radius_metres")
      .eq("id", client_id)
      .single();
    organisationId = client?.organisation_id ?? null;
    if (client) clientName = `${client.first_name} ${client.last_name}`;

    // Server-side approved-radius check (BUILD_SPEC E/B8) — never trust the client flag.
    radiusResult = withinApprovedRadius(
      gps_lat, gps_lng, client?.gps_lat, client?.gps_lng, client?.approved_radius_metres ?? 300
    );

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
  }

  const logRow: Record<string, unknown> = {
    shift_id, client_id: client_id || null, staff_id: user.id,
    log_type, content,
    gps_lat: gps_lat ?? null, gps_lng: gps_lng ?? null,
    within_approved_radius: radiusResult,
    server_timestamp: now,
  };
  // Only attach triggers_detected when something matched, so normal logging
  // never depends on that column being present in the live schema.
  if (triggersDetected.length) logRow.triggers_detected = triggersDetected;

  const { data, error } = await supabase.from("shift_logs").insert(logRow).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (triggersDetected.length && organisationId) {
    await notify(supabase, {
      organisationId,
      recipientGroups: ["manager"],
      message: messages.triggerActivated(clientName, triggersDetected.join(", ")),
    });
  }

  return NextResponse.json({ log: data, triggers_detected: triggersDetected, within_approved_radius: radiusResult });
}
