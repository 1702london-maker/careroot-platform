import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Runs daily — invalidates expired shift credentials
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("shift_credentials")
    .update({ is_active: false })
    .eq("is_active", true)
    .lt("valid_until", now)
    .select("id");

  if (error) {
    console.error("cleanup-credentials error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cleaned: data?.length || 0, timestamp: now });
}
