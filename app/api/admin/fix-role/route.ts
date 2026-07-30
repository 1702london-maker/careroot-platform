import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentUser?.role !== "superadmin") {
    return NextResponse.json({ error: "This support route is disabled for non-superadmin users." }, { status: 403 });
  }

  return NextResponse.json(
    { error: "Role repair must be performed through the audited users admin screen." },
    { status: 410 }
  );
}
