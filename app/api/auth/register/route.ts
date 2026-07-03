import { NextRequest, NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, orgName, orgType, firstName, lastName, phone, cqcProviderId } = body;

    if (!userId || !email || !orgName || !orgType || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const service = createServiceClientSync();

    // Verify the auth user exists
    const { data: authUser, error: authErr } = await service.auth.admin.getUserById(userId);
    if (authErr || !authUser) {
      return NextResponse.json({ error: "Auth user not found" }, { status: 400 });
    }

    // Check not already set up
    const { data: existing } = await service
      .from("users")
      .select("organisation_id")
      .eq("id", userId)
      .maybeSingle();

    if (existing?.organisation_id) {
      return NextResponse.json({ success: true, message: "Already set up" });
    }

    // Create organisation
    const { data: org, error: orgErr } = await service
      .from("organisations")
      .insert({
        name: orgName,
        org_type: orgType,
        cqc_provider_id: cqcProviderId || null,
        plan: "seed",
        status: "active",
      })
      .select("id")
      .single();

    if (orgErr || !org) {
      console.error("Org creation error:", orgErr);
      return NextResponse.json({ error: "Failed to create organisation" }, { status: 500 });
    }

    // Create public.users row — use upsert in case row already exists without org
    const { error: userErr } = await service
      .from("users")
      .upsert({
        id: userId,
        email,
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
      await service.from("organisations").delete().eq("id", org.id);
      return NextResponse.json({ error: "Failed to set up user profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, organisationId: org.id });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
