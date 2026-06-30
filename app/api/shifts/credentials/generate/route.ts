import { createClient } from "@/lib/supabase/server";
import { sendSMS } from "@/lib/twilio";
import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: caller } = await supabase.from("users").select("role, organisation_id").eq("id", user.id).single();
  if (!caller || !["superadmin", "org_admin", "manager", "coordinator"].includes(caller.role)) {
    return NextResponse.json({ error: "Only managers can generate shift credentials" }, { status: 403 });
  }

  const { shift_id } = await req.json();
  if (!shift_id) return NextResponse.json({ error: "shift_id required" }, { status: 400 });

  const { data: shift } = await supabase
    .from("shifts")
    .select("id, staff_id, scheduled_start, scheduled_end, organisation_id, status")
    .eq("id", shift_id)
    .eq("organisation_id", caller.organisation_id)
    .single();

  if (!shift) return NextResponse.json({ error: "Shift not found" }, { status: 404 });
  if (shift.status === "completed") return NextResponse.json({ error: "Shift already completed" }, { status: 400 });

  const { data: staffMember } = await supabase
    .from("users")
    .select("id, first_name, last_name, phone")
    .eq("id", shift.staff_id)
    .single();

  if (!staffMember) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  if (!staffMember.phone) return NextResponse.json({ error: "Staff member has no phone number on record" }, { status: 422 });

  // Invalidate any existing active credentials for this shift
  await supabase
    .from("shift_credentials")
    .update({ invalidated_at: new Date().toISOString() })
    .eq("shift_id", shift_id)
    .is("invalidated_at", null);

  const pin = generatePin();
  const token = generateToken();
  const pinHash = await bcrypt.hash(pin, 10);

  // Credentials valid from 30 min before shift start to 30 min after shift end
  const shiftStart = new Date(shift.scheduled_start);
  const shiftEnd = new Date(shift.scheduled_end);
  const validFrom = new Date(shiftStart.getTime() - 30 * 60 * 1000);
  const validUntil = new Date(shiftEnd.getTime() + 30 * 60 * 1000);

  const { data: credential, error } = await supabase
    .from("shift_credentials")
    .insert({
      staff_id: shift.staff_id,
      shift_id,
      pin_hash: pinHash,
      token,
      valid_from: validFrom.toISOString(),
      valid_until: validUntil.toISOString(),
      delivery_method: "sms",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const shiftDate = shiftStart.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const shiftTime = shiftStart.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const smsBody = `Careroot Shift Access\n\nHi ${staffMember.first_name},\n\nYour PIN for ${shiftDate} at ${shiftTime}:\n\n${pin}\n\nThis PIN expires 30 minutes after your shift ends. Do not share it with anyone.\n\nCareroot`;

  const smsResult = await sendSMS(staffMember.phone, smsBody);

  await supabase
    .from("shift_credentials")
    .update({ delivered_at: smsResult.success ? new Date().toISOString() : null })
    .eq("id", credential.id);

  return NextResponse.json({
    credential_id: credential.id,
    staff_name: `${staffMember.first_name} ${staffMember.last_name}`,
    sms_sent: smsResult.success,
    valid_from: validFrom.toISOString(),
    valid_until: validUntil.toISOString(),
    ...(smsResult.success ? {} : { sms_error: String(smsResult.error) }),
  });
}
