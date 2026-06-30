import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  orgName: z.string().min(2),
  orgType: z.enum(["domiciliary", "supported_living", "residential", "internal"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup details" }, { status: 400 });
  }

  const { orgName, orgType, firstName, lastName, email, password } = parsed.data;

  // Use anon client — no service role key needed
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName, role: "org_admin" },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (authError || !authData.user) {
    const msg = authError?.message ?? "Failed to create account";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Create org + user profile via SECURITY DEFINER function (bypasses RLS)
  const { error: rpcError } = await supabase.rpc("create_organisation_and_user", {
    p_user_id: authData.user.id,
    p_org_name: orgName,
    p_org_type: orgType,
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: email,
  });

  if (rpcError) {
    // Clean up auth user if org creation fails
    console.error("[signup] RPC error:", rpcError.message);
    return NextResponse.json({ error: "Failed to set up organisation: " + rpcError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
