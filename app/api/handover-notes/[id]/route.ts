import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { invalidIdResponse, isUuid } from "@/lib/route-params";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return invalidIdResponse();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { data: caller } = await supabase
    .from("users")
    .select("role, organisation_id")
    .eq("id", user.id)
    .single();

  const { data: handover } = await supabase
    .from("handover_notes")
    .select("id, outgoing_staff_id, incoming_staff_id, client_id, shift_id")
    .eq("id", params.id)
    .single();

  if (!handover) return NextResponse.json({ error: "Handover not found" }, { status: 404 });

  const updates: Record<string, string> = {};
  if (body.action === "confirm_read") {
    if (handover.incoming_staff_id && handover.incoming_staff_id !== user.id) {
      return NextResponse.json({ error: "This handover is assigned to another incoming worker" }, { status: 403 });
    }

    if (!handover.incoming_staff_id) {
      const { data: activeShift } = await supabase
        .from("shifts")
        .select("id")
        .eq("staff_id", user.id)
        .contains("client_ids", [handover.client_id])
        .in("status", ["active", "scheduled"])
        .limit(1)
        .maybeSingle();

      if (!activeShift) {
        return NextResponse.json({ error: "You do not have access to confirm this handover" }, { status: 403 });
      }
    }

    updates.incoming_read_confirmed_at = new Date().toISOString();
  } else if (body.action === "approve") {
    const role = caller?.role ?? "";
    const { data: outgoingStaff } = await supabase
      .from("users")
      .select("organisation_id")
      .eq("id", handover.outgoing_staff_id)
      .single();
    const sameOrg = caller?.organisation_id && caller.organisation_id === outgoingStaff?.organisation_id;
    if (!(sameOrg && ["superadmin", "org_admin", "manager", "coordinator"].includes(role))) {
      return NextResponse.json({ error: "Only authorised office users can approve handovers" }, { status: 403 });
    }
    updates.outgoing_approved_at = new Date().toISOString();
  } else {
    return NextResponse.json({ error: "Unsupported handover update" }, { status: 400 });
  }

  const { data, error } = await supabase.from("handover_notes").update(updates).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ handover: data });
}
