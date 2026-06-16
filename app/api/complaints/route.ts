import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { complaintAcknowledgedEmail, complaintInternalEmail } from "@/lib/emails";

function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000); // 5-digit number
  return `CR-${year}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      client_id,
      category,
      description,
      desired_outcome,
      incident_date,
      is_anonymous,
      wants_cqc_escalation,
      submitted_by_name,
      submitted_by_email,
    } = body;

    if (!description) {
      return NextResponse.json({ error: "description required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { data: userRecord } = await supabase.from("users")
      .select("organisation_id, first_name, last_name")
      .eq("id", user.id).single();

    if (!userRecord?.organisation_id) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 400 });
    }

    const reference_number = generateReferenceNumber();

    const { data: complaint, error: insertError } = await supabase.from("complaints").insert({
      organisation_id: userRecord.organisation_id,
      client_id: client_id ?? null,
      submitted_by: is_anonymous ? null : user.id,
      reference_number,
      category,
      description,
      desired_outcome: desired_outcome ?? null,
      incident_date: incident_date ?? null,
      is_anonymous: is_anonymous ?? false,
      wants_cqc_escalation: wants_cqc_escalation ?? false,
      status: "open",
    }).select().single();

    if (insertError || !complaint) {
      console.error("complaint insert error:", insertError);
      return NextResponse.json({ error: "Failed to create complaint" }, { status: 500 });
    }

    if (process.env.RESEND_API_KEY) {
      const resend = getResend();

      // Acknowledgement to complainant
      const complainantEmail = submitted_by_email ?? user.email;
      const complainantName = submitted_by_name ?? `${userRecord.first_name} ${userRecord.last_name}`;

      const { data: org } = await supabase.from("organisations")
        .select("name").eq("id", userRecord.organisation_id).single();

      if (complainantEmail && !is_anonymous) {
        const ackTpl = complaintAcknowledgedEmail({
          name: complainantName,
          referenceNumber: reference_number,
          orgName: org?.name ?? "the care organisation",
        });
        await resend.emails.send({ from: FROM_EMAIL, to: complainantEmail, ...ackTpl });
      }

      // Internal notification to managers
      const { data: managers } = await supabase.from("users")
        .select("email").eq("organisation_id", userRecord.organisation_id)
        .in("role", ["org_admin", "manager"]).eq("is_active", true);

      if (managers?.length) {
        const internalTpl = complaintInternalEmail({
          referenceNumber: reference_number,
          submittedBy: is_anonymous ? "Anonymous" : complainantName,
          category: category ?? "other",
          description,
          severity: wants_cqc_escalation ? "high" : "medium",
        });
        for (const mgr of managers) {
          if (!mgr.email) continue;
          await resend.emails.send({ from: FROM_EMAIL, to: mgr.email, ...internalTpl });
        }
      }
    }

    return NextResponse.json({ success: true, complaint, reference_number });
  } catch (error) {
    console.error("complaints POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
