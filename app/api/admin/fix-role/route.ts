import { NextResponse } from "next/server";
import { createClient, createServiceClientSync } from "@/lib/supabase/server";

// One-time route to promote the authenticated user to org_admin
// Safe: only works if user is already authenticated and has no role or wrong role
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const service = createServiceClientSync();

  const { data: existing } = await service
    .from("users")
    .select("role, organisation_id")
    .eq("id", user.id)
    .single();

  if (existing?.role === "org_admin" || existing?.role === "superadmin") {
    return NextResponse.json({ message: "Role already correct", role: existing.role });
  }

  const { error } = await service
    .from("users")
    .update({ role: "org_admin" })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: "Role updated to org_admin" });
}
