import { NextRequest, NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";
import { sendSMS } from "@/lib/twilio";
import { messages } from "@/lib/notifications";
import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Auto-generate and SMS shift credentials ~30 minutes before each shift start
 * (BUILD_SPEC B4 / B21). Ideally runs every 15 minutes (needs Vercel Pro).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClientSync();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 30 * 60 * 1000); // next 30 minutes

  // Scheduled shifts starting within the next 30 minutes.
  const { data: shifts } = await supabase
    .from("shifts")
    .select("id, staff_id, scheduled_start, scheduled_end")
    .eq("status", "scheduled")
    .gte("scheduled_start", now.toISOString())
    .lte("scheduled_start", windowEnd.toISOString());

  let generated = 0;
  for (const shift of shifts ?? []) {
    // Skip if a live credential already exists.
    const { data: existing } = await supabase
      .from("shift_credentials")
      .select("id")
      .eq("shift_id", shift.id)
      .is("invalidated_at", null)
      .limit(1)
      .maybeSingle();
    if (existing) continue;

    const { data: staff } = await supabase
      .from("users").select("phone").eq("id", shift.staff_id).single();
    if (!staff?.phone) continue;

    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const token = crypto.randomBytes(32).toString("hex");
    const pinHash = await bcrypt.hash(pin, 10);

    const validFrom = new Date(new Date(shift.scheduled_start).getTime() - 30 * 60 * 1000);
    const validUntil = new Date(new Date(shift.scheduled_end).getTime() + 30 * 60 * 1000);

    await supabase.from("shift_credentials").insert({
      staff_id: shift.staff_id,
      shift_id: shift.id,
      pin_hash: pinHash,
      token,
      valid_from: validFrom.toISOString(),
      valid_until: validUntil.toISOString(),
      delivered_at: now.toISOString(),
      delivery_method: "sms",
    });

    await sendSMS(
      staff.phone,
      messages.shiftCredential(
        pin,
        validFrom.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        validUntil.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      )
    );
    generated++;
  }

  return NextResponse.json({ ok: true, generated });
}
