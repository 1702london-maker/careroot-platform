import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  orgName: z.string().min(2),
  orgType: z.enum(["domiciliary", "supported_living", "residential", "internal"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup details" }, { status: 400 });
  }

  const { orgName, orgType, firstName, lastName, email, password } = parsed.data;
  const supabase = await createServiceClient();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      role: "org_admin",
    },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Failed to create account" },
      { status: 400 }
    );
  }

  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .insert({
      name: orgName,
      type: orgType,
      plan: "seed",
      plan_status: "trial",
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      max_staff: 10,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: "Failed to create organisation" }, { status: 400 });
  }

  const { error: userError } = await supabase
    .from("users")
    .upsert({
      id: authData.user.id,
      organisation_id: org.id,
      first_name: firstName,
      last_name: lastName,
      email,
      role: "org_admin",
      is_active: true,
    });

  if (userError) {
    await supabase.from("organisations").delete().eq("id", org.id);
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: "Failed to create user profile" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
