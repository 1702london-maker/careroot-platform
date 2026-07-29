import { createClient } from "@/lib/supabase/server";
import { formatDateTimeUK } from "@/lib/utils";
import { Clock, FileText, MapPin } from "lucide-react";

export default async function CarerLogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: logs } = await supabase
    .from("shift_logs")
    .select("id, log_type, content, transcription, server_timestamp, within_approved_radius, clients(first_name, last_name)")
    .eq("staff_id", user!.id)
    .order("server_timestamp", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-3">
      <h1 className="font-display text-xl font-semibold text-cr-charcoal mb-1">My Shift Notes</h1>
      <p className="mb-4 text-xs font-body text-cr-slate">Care notes you have saved during active shifts.</p>

      {!logs?.length ? (
        <div className="text-center py-16">
          <FileText size={40} className="text-cr-slate mx-auto mb-3 opacity-40" />
          <p className="text-sm font-body text-cr-slate">No shift notes yet.</p>
        </div>
      ) : (
        logs.map((log) => {
          const client = log.clients as unknown as { first_name: string; last_name: string } | null;
          return (
            <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <p className="font-body font-semibold text-cr-charcoal text-sm">
                  {client ? `${client.first_name} ${client.last_name}` : "-"}
                </p>
                <span className="rounded-full bg-cr-mint px-2 py-0.5 text-[10px] font-body font-semibold capitalize text-cr-forest">
                  {String(log.log_type).replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1 text-xs text-cr-slate font-body mb-2">
                <Clock size={11} />
                <span>{formatDateTimeUK(log.server_timestamp)}</span>
                {log.within_approved_radius === true && (
                  <span className="ml-2 inline-flex items-center gap-1 text-green-700">
                    <MapPin size={10} /> Location verified
                  </span>
                )}
              </div>
              <p className="border-t border-gray-50 pt-2 mt-2 text-xs font-body leading-relaxed text-cr-slate">{log.content}</p>
              {log.transcription && log.transcription !== log.content && (
                <p className="mt-2 rounded-lg bg-gray-50 p-2 text-[11px] font-body leading-relaxed text-cr-slate">
                  Voice transcript: {log.transcription}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
