import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { shift_id, client_id, meal_type, offered, consumed, fluid_intake_ml, concerns } = await req.json();
  if (!shift_id || !client_id || !meal_type) {
    return NextResponse.json({ error: "shift_id, client_id, meal_type required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("nutrition_records").insert({
    shift_id, client_id, staff_id: user.id,
    meal_type, offered: offered || null, consumed: consumed || null,
    fluid_intake_ml: fluid_intake_ml ?? null, concerns: concerns || null,
    server_timestamp: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}
