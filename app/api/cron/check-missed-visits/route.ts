import { NextRequest, NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClientSync();
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();

  // Find visits that should have started but are still scheduled
  const { data: missedVisits } = await supabase
    .from("visits")
    .select("id, client_id, organisation_id, carer_id, scheduled_start, scheduled_end, clients(first_name, last_name, address)")
    .eq("status", "scheduled")
    .lte("scheduled_start", fifteenMinutesAgo)
    .gte("scheduled_start", todayStart);

  if (!missedVisits?.length) {
    return NextResponse.json({ checked: true, missed: 0 });
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@careroot.care";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care";
  let missedCount = 0;

  for (const visit of missedVisits) {
    // Mark as missed
    await supabase.from("visits").update({ status: "missed" }).eq("id", visit.id);
    missedCount++;

    const client = visit.clients as Record<string, string> | null;
    const clientName = client ? `${client.first_name} ${client.last_name}` : "Unknown client";
    const startTime = new Date(visit.scheduled_start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    // Alert managers
    const { data: managers } = await supabase
      .from("users")
      .select("email")
      .eq("organisation_id", visit.organisation_id)
      .in("role", ["owner", "manager"])
      .eq("is_active", true);

    if (resend && managers?.length) {
      for (const mgr of managers) {
        if (!mgr.email) continue;
        await resend.emails.send({
          from,
          to: mgr.email,
          subject: `⚠️ Missed visit — ${clientName} — due ${startTime}`,
          html: `<div style="font-family:sans-serif;max-width:600px">
            <div style="background:#1A3C2E;padding:20px;border-radius:8px 8px 0 0">
              <h2 style="color:white;margin:0">Missed Visit Alert</h2>
            </div>
            <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
              <p><strong>${clientName}</strong> had a visit scheduled for <strong>${startTime}</strong> that has not been started.</p>
              <p>Address: ${Object.values(client?.address ? JSON.parse(String(client.address)) : {}).join(", ")}</p>
              <p><a href="${appUrl}/visits/${visit.id}" style="background:#1A3C2E;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View visit →</a></p>
            </div>
          </div>`,
        });
      }
    }
  }

  return NextResponse.json({ checked: true, missed: missedCount });
}
