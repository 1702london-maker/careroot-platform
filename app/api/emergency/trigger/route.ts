import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSMS } from "@/lib/twilio";
import { resend, FROM_EMAIL } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { client_id, visit_id, lat, lng, carer_name, organisation_id } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    // Get client and org details
    const [{ data: client }, { data: org }, { data: token }] = await Promise.all([
      supabase.from("clients").select("first_name, last_name, address, emergency_contact, gp_details")
        .eq("id", client_id).single(),
      supabase.from("organisations").select("name, on_call_phone, email")
        .eq("id", organisation_id).single(),
      supabase.from("emergency_access_tokens").select("token, pin")
        .eq("client_id", client_id).single(),
    ]);

    const clientName = `${client?.first_name} ${client?.last_name}`;
    const clientAddress = typeof client?.address === "object"
      ? Object.values(client.address).filter(Boolean).join(", ")
      : String(client?.address || "");

    const emergencyLink = token
      ? `${process.env.NEXT_PUBLIC_APP_URL}/emergency/${token.token}`
      : "";
    const pin = token?.pin || "";

    const smsBody = `EMERGENCY: ${carer_name || "A carer"} has triggered an emergency alert for ${clientName} at ${clientAddress}. Emergency record: ${emergencyLink} PIN: ${pin}. Call 999 if not already done. — ${org?.name}`;

    const notificationsSent = [];

    // SMS to on-call manager
    if (org?.on_call_phone) {
      const result = await sendSMS(org.on_call_phone, smsBody);
      if (result.success) notificationsSent.push({ type: "sms", to: "on_call" });
    }

    // SMS to all emergency contacts
    const emergencyContacts = Array.isArray(client?.emergency_contact)
      ? client.emergency_contact
      : [];

    for (const contact of emergencyContacts) {
      const c = contact as Record<string, string>;
      if (c.phone) {
        const contactSMS = `EMERGENCY re: ${clientName} — ${carer_name || "care worker"} has triggered an emergency. ${clientAddress}. Emergency access: ${emergencyLink} PIN: ${pin}. Please call 999 if not done. — ${org?.name}`;
        await sendSMS(c.phone, contactSMS);
        notificationsSent.push({ type: "sms", to: c.name || "emergency_contact" });
      }
    }

    // Email to GP
    const gpEmail = (client?.gp_details as Record<string, string>)?.email;
    if (gpEmail) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: gpEmail,
        subject: `🚨 Emergency alert — ${clientName}`,
        html: `<p>An emergency has been triggered for your patient <strong>${clientName}</strong>.</p><p>Location: ${clientAddress}</p><p>Time: ${new Date().toLocaleString("en-GB")}</p><p>Emergency access: <a href="${emergencyLink}">${emergencyLink}</a> PIN: ${pin}</p><p>Notified by: ${org?.name}</p>`,
      });
      notificationsSent.push({ type: "email", to: "gp" });
    }

    // Create emergency event
    const { data: emergencyEvent } = await supabase.from("emergency_events").insert({
      organisation_id,
      client_id,
      triggered_by: user?.id,
      trigger_source: "carer",
      visit_id,
      lat,
      lng,
      address: clientAddress,
      notifications_sent: notificationsSent,
      status: "active",
    }).select().single();

    // Create critical incident
    await supabase.from("incidents").insert({
      organisation_id,
      client_id,
      reported_by: user?.id,
      visit_id,
      title: `Emergency alert triggered — ${clientName}`,
      severity: "critical",
      category: "emergency",
      status: "open",
      is_family_visible: false,
      reported_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      emergency_event_id: emergencyEvent?.id,
      notifications_sent: notificationsSent.length,
    });
  } catch (error) {
    console.error("emergency trigger error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
