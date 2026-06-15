import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { AlertOctagon } from "lucide-react";

export default async function EmergencyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id").eq("id", user.id).single();
  const orgId = userRecord?.organisation_id;

  const { data: events } = await supabase
    .from("emergency_events")
    .select("*, clients(first_name, last_name), users(first_name, last_name)")
    .eq("organisation_id", orgId)
    .order("created_at", { ascending: false });

  const statusVariant = (s: string): "red" | "green" | "slate" => {
    if (s === "open" || s === "active") return "red";
    if (s === "resolved") return "green";
    return "slate";
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div>
      <CRPageHeader
        title="Emergency Event Log"
        subtitle="All emergency events recorded by carers or triggered automatically"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
      />

      {!events || events.length === 0 ? (
        <CREmptyState
          icon={<AlertOctagon className="text-cr-slate" size={40} />}
          title="No emergency events recorded"
          description="Emergency events are logged by carers during visits or triggered by the system"
        />
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const client = event.clients as Record<string, string> | null;
            const triggeredBy = event.users as Record<string, string> | null;
            return (
              <CRCard key={String(event.id)}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                    <AlertOctagon size={18} className="text-cr-red" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-body font-semibold text-cr-charcoal">
                        {client ? `${client.first_name} ${client.last_name}` : "Unknown Client"}
                      </p>
                      <CRBadge variant={statusVariant(String(event.status || "open"))}>
                        {String(event.status || "open")}
                      </CRBadge>
                      {event.trigger_source && (
                        <CRBadge variant="slate" size="sm">{String(event.trigger_source)}</CRBadge>
                      )}
                    </div>
                    <p className="text-xs text-cr-slate mb-1">
                      {fmt(String(event.created_at || event.event_date))}
                      {triggeredBy && ` · Triggered by: ${triggeredBy.first_name} ${triggeredBy.last_name}`}
                    </p>
                    {event.address && (
                      <p className="text-xs text-cr-slate">📍 {String(event.address)}</p>
                    )}
                    {event.description && (
                      <p className="text-sm font-body text-cr-slate mt-2 line-clamp-2">
                        {String(event.description)}
                      </p>
                    )}
                  </div>
                </div>
              </CRCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
