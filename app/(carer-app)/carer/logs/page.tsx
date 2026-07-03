import { createClient } from "@/lib/supabase/server";
import { formatDateTimeUK } from "@/lib/utils";
import { FileText, Clock } from "lucide-react";

export default async function CarerLogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: visits } = await supabase
    .from("visits")
    .select(`id, scheduled_start, scheduled_end, actual_start, actual_end, status, notes, clients(first_name, last_name)`)
    .eq("carer_id", user!.id)
    .order("scheduled_start", { ascending: false })
    .limit(50);

  const statusColour = (s: string) => {
    if (s === "completed") return "bg-green-100 text-green-700";
    if (s === "missed") return "bg-red-100 text-red-700";
    if (s === "in_progress") return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-3">
      <h1 className="font-display text-xl font-semibold text-cr-charcoal mb-4">My Visit Logs</h1>

      {!visits?.length ? (
        <div className="text-center py-16">
          <FileText size={40} className="text-cr-slate mx-auto mb-3 opacity-40" />
          <p className="text-sm font-body text-cr-slate">No visit records yet.</p>
        </div>
      ) : (
        visits.map((v) => {
          const client = v.clients as { first_name: string; last_name: string } | null;
          return (
            <div key={v.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <p className="font-body font-semibold text-cr-charcoal text-sm">
                  {client ? `${client.first_name} ${client.last_name}` : "—"}
                </p>
                <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full capitalize ${statusColour(v.status)}`}>
                  {v.status?.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-cr-slate font-body mb-2">
                <Clock size={11} />
                <span>{formatDateTimeUK(v.scheduled_start)}</span>
                {v.scheduled_end && <span>– {new Date(v.scheduled_end).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}</span>}
              </div>
              {v.notes && (
                <p className="text-xs font-body text-cr-slate border-t border-gray-50 pt-2 mt-2 line-clamp-2">{v.notes}</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
