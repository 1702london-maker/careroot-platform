import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { welcomeEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  try {
    const { first_name, org_name } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ ok: false });

    const tpl = welcomeEmail(first_name ?? "there", org_name ?? "your organisation");
    await getResend().emails.send({ from: FROM_EMAIL, to: user.email, ...tpl });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
