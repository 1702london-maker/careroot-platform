import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CarerEmarClient } from "@/components/carer/CarerEmarClient";

export default async function CarerEmarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

  // Only show eMAR for clients on an active/recent shift
  const { data: activeShifts } = await supabase
    .from("shifts")
    .select("id, client_ids, scheduled_end, actual_end, status")
    .eq("staff_id", user.id)
    .in("status", ["active", "completed"])
    .gte("scheduled_end", thirtyMinsAgo.toISOString());

  const accessibleClientIds: string[] = [];
  const activeShiftId = activeShifts?.find(shift => shift.status === "active")?.id ?? activeShifts?.[0]?.id ?? "";
  activeShifts?.forEach(shift => {
    const ended = shift.actual_end || shift.scheduled_end;
    const endTime = new Date(ended).getTime();
    const cutoff = now.getTime() - 30 * 60 * 1000;
    if (shift.status === "active" || endTime >= cutoff) {
      (shift.client_ids ?? []).forEach((id: string) => {
        if (!accessibleClientIds.includes(id)) accessibleClientIds.push(id);
      });
    }
  });

  if (accessibleClientIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <h1 className="font-display text-xl font-semibold text-cr-charcoal">eMAR</h1>
          <p className="text-xs text-cr-slate">Medication Administration Record</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="text-4xl mb-4">💊</div>
          <p className="font-semibold text-cr-charcoal">No active shift</p>
          <p className="text-sm text-cr-slate mt-2">
            eMAR is only accessible during an active shift or up to 30 minutes after a shift ends.
          </p>
        </div>
      </div>
    );
  }

  const [{ data: clients }, { data: medications }, { data: administrations }] = await Promise.all([
    supabase.from("clients")
      .select("id, first_name, last_name, date_of_birth, photo_url")
      .in("id", accessibleClientIds),
    supabase.from("medication_schedules")
      .select("id, client_id, medication_name, dose, route, frequency, time_of_day, special_instructions, is_controlled, is_prn")
      .in("client_id", accessibleClientIds)
      .eq("is_active", true),
    supabase.from("medication_records")
      .select("id, medication_schedule_id, client_id, status, administered_at, created_at, outcome_notes")
      .in("client_id", accessibleClientIds)
      .gte("created_at", new Date().toISOString().slice(0, 10) + "T00:00:00")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="font-display text-xl font-semibold text-cr-charcoal">eMAR</h1>
        <p className="text-xs text-cr-slate">Today&apos;s Medication Administration Record</p>
      </div>
      <div className="px-4 py-4">
        <CarerEmarClient
          clients={clients ?? []}
          medications={medications ?? []}
          initialAdministrations={administrations ?? []}
          activeShiftId={activeShiftId}
        />
      </div>
    </div>
  );
}
