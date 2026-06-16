import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { domain } = await req.json();
  if (!domain) return NextResponse.json({ error: "domain required" }, { status: 400 });

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id, role").eq("id", user.id).single();
  if (userRecord?.role !== "org_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const orgId = userRecord.organisation_id;

  const { error } = await supabase.from("white_label_domains").upsert({
    organisation_id: orgId,
    domain: domain.toLowerCase().trim(),
    verification_token: token,
    verified: false,
  }, { onConflict: "domain" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    token,
    dns_records: [
      {
        type: "CNAME",
        name: "www",
        value: "careroot-platform.vercel.app",
        description: "Points your domain to Careroot infrastructure",
      },
      {
        type: "TXT",
        name: "@",
        value: `careroot-verify=${token}`,
        description: "Proves you own this domain",
      },
    ],
    instructions: "Add both DNS records to your domain registrar, then click Verify Domain. Changes can take up to 24 hours to propagate.",
  });
}
