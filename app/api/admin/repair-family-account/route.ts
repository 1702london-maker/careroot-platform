import { NextRequest, NextResponse } from "next/server";
import { createServiceClientSync } from "@/lib/supabase/server";

const ALLOWED_ROLES = new Set(["superadmin", "org_admin", "manager"]);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "Bearer token required" }, { status: 401 });

  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password || String(password).length < 8) {
    return NextResponse.json({ error: "Valid email and password are required" }, { status: 400 });
  }

  const service = createServiceClientSync();
  const { data: authUser, error: authError } = await service.auth.getUser(token);
  if (authError || !authUser.user) {
    return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
  }

  const { data: caller } = await service
    .from("users")
    .select("id, role, organisation_id")
    .eq("id", authUser.user.id)
    .single();

  if (!caller?.organisation_id || !ALLOWED_ROLES.has(caller.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: familyUser, error: familyError } = await service
    .from("users")
    .select("id, role, organisation_id")
    .eq("email", String(email).toLowerCase())
    .single();

  if (familyError || !familyUser) {
    return NextResponse.json({ error: "Family user not found" }, { status: 404 });
  }

  if (familyUser.role !== "family" || familyUser.organisation_id !== caller.organisation_id) {
    return NextResponse.json({ error: "Family user is not in your organisation" }, { status: 403 });
  }

  const { error: updateError } = await service.auth.admin.updateUserById(familyUser.id, {
    password,
    email_confirm: true,
    user_metadata: { role: "family" },
    app_metadata: { role: "family" },
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const acceptedAt = new Date().toISOString();
  const [{ error: userError }, { error: accessError }] = await Promise.all([
    service
      .from("users")
      .update({ is_active: true, must_change_password: false, role: "family" })
      .eq("id", familyUser.id),
    service
      .from("family_access")
      .update({ is_active: true, invite_accepted_at: acceptedAt })
      .eq("user_id", familyUser.id)
      .eq("organisation_id", caller.organisation_id),
  ]);

  if (userError || accessError) {
    return NextResponse.json({ error: userError?.message ?? accessError?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user_id: familyUser.id });
}
