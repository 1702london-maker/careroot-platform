import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendSMS } from "@/lib/twilio";
import { getResend, FROM_EMAIL } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { token, pin } = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    if (!token || !pin) {
      return NextResponse.json({ error: "Token and PIN required" }, { status: 400 });
    }

    // Use service client — this is a public endpoint
    const supabase = await createServiceClient();

    const { data: tokenRecord } = await supabase
      .from("emergency_access_tokens")
      .select("*, clients(*, medications(name, dosage, frequency, route, is_active), organisations(name, phone, on_call_phone))")
      .eq("token", token)
      .single();

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid access token" }, { status: 404 });
    }

    if (tokenRecord.pin !== pin) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    // Log the access
    await supabase.from("emergency_access_tokens").update({
      accessed_at: new Date().toISOString(),
      access_count: (tokenRecord.access_count || 0) + 1,
      last_access_ip: ip,
    }).eq("token", token);

    const client = tokenRecord.clients as Record<string, unknown> | null;
    const org = (client?.organisations as Record<string, string> | null);

    // Alert manager on access
    const { data: managers } = await supabase.from("users")
      .select("email, phone")
      .eq("organisation_id", tokenRecord.organisation_id)
      .in("role", ["org_admin", "manager"])
      .eq("is_active", true);

    const { data: orgRecord } = await supabase.from("organisations")
      .select("on_call_phone, name")
      .eq("id", tokenRecord.organisation_id)
      .single();

    const clientName = `${(client?.first_name as string)} ${(client?.last_name as string)}`;
    const timestamp = new Date().toLocaleString("en-GB");
    const alertMsg = `ALERT: Emergency medical access for ${clientName} was used at ${timestamp}. IP: ${ip}. Log in to Careroot for details. — ${orgRecord?.name}`;

    if (orgRecord?.on_call_phone) {
      await sendSMS(orgRecord.on_call_phone, alertMsg);
    }

    for (const manager of managers || []) {
      if (manager.email) {
        await getResend().emails.send({
          from: FROM_EMAIL,
          to: manager.email,
          subject: `🚨 Emergency record accessed — ${clientName}`,
          html: `<p>The emergency medical record for <strong>${clientName}</strong> was accessed at ${timestamp}.</p><p>IP address: ${ip}</p><p>Access count: ${(tokenRecord.access_count || 0) + 1}</p>`,
        });
      }
    }

    // Return patient emergency data
    return NextResponse.json({
      success: true,
      patient: {
        first_name: client?.first_name,
        last_name: client?.last_name,
        date_of_birth: client?.date_of_birth,
        nhs_number: client?.nhs_number,
        dnr_status: client?.dnr_status,
        address: client?.address,
        gp_details: client?.gp_details,
        emergency_contact: client?.emergency_contact,
        medications: (client?.medications as unknown[]) || [],
        care_agency_name: org?.name,
        care_agency_phone: org?.phone,
        last_updated: client?.updated_at,
      },
    });
  } catch (error) {
    console.error("emergency verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
