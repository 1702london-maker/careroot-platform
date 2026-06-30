import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  acceptedTerms: z.literal(true),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please choose a password of at least 8 characters and accept the terms." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // 1. Update the auth password.
  const { error: pwError } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (pwError) {
    return NextResponse.json({ error: pwError.message }, { status: 400 });
  }

  // 2. Clear the first-login flag and record terms acceptance.
  const { error: profileError } = await supabase
    .from("users")
    .update({ must_change_password: false, terms_accepted_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: "Password changed, but profile update failed. Please contact support." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
