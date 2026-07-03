import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { orgName, orgType, firstName, lastName, phone, cqcProviderId } = body;

    if (!orgName || !orgType || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check user doesn't already have a users row with an org
    const { data: existing } = await supabase
      .from("users")
      .select("organisation_id")
      .eq("id", user.id)
      .single();

    if (existing?.organisation_id) {
      return NextResponse.json({ error: "Account already set up" }, { status: 409 });
    }

    const service = await createServiceClient();

    // Create organisation
    const { data: org, error: orgErr } = await service
      .from("organisations")
      .insert({
        name: orgName,
        type: orgType,
        cqc_provider_id: cqcProviderId || null,
        plan: "seed",
        plan_status: "active",
      })
      .select("id")
      .single();

    if (orgErr || !org) {
      console.error("Org creation error:", orgErr);
      return NextResponse.json({ error: "Failed to create organisation" }, { status: 500 });
    }

    // Upsert the public.users row
    const { error: userErr } = await service
      .from("users")
      .upsert({
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        organisation_id: org.id,
        role: "org_admin",
        status: "active",
        must_change_password: false,
        terms_accepted_at: new Date().toISOString(),
      });

    if (userErr) {
      console.error("User row error:", userErr);
      // Roll back org if user insert fails
      await service.from("organisations").delete().eq("id", org.id);
      return NextResponse.json({ error: "Failed to set up user profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, organisationId: org.id });
  } catch (err) {
    console.error("complete-setup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
