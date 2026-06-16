import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import dns from "dns/promises";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { domain } = await req.json();
  if (!domain) return NextResponse.json({ error: "domain required" }, { status: 400 });

  const serviceSupabase = await createServiceClient();

  const { data: domainRecord } = await serviceSupabase
    .from("white_label_domains")
    .select("verification_token, organisation_id")
    .eq("domain", domain.toLowerCase().trim())
    .single();

  if (!domainRecord) {
    return NextResponse.json({ verified: false, error: "Domain not found — start verification first" });
  }

  const expectedToken = `careroot-verify=${domainRecord.verification_token}`;

  try {
    const records = await dns.resolveTxt(domain.toLowerCase().trim());
    const flat = records.flat();
    const verified = flat.some((r) => r === expectedToken);

    if (verified) {
      await serviceSupabase.from("white_label_domains")
        .update({ verified: true })
        .eq("domain", domain.toLowerCase().trim());

      await serviceSupabase.from("organisations")
        .update({ wl_domain: domain.toLowerCase().trim() })
        .eq("id", domainRecord.organisation_id);
    }

    return NextResponse.json({ verified, expected: expectedToken, found: flat });
  } catch {
    return NextResponse.json({ verified: false, error: "DNS lookup failed — records may not have propagated yet" });
  }
}
