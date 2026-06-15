import { createClient } from "@/lib/supabase/server";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { CRAvatar } from "@/components/ui/CRAvatar";
import { formatDateUK, formatTimeUK } from "@/lib/utils";
import { Calendar, Plus } from "lucide-react";
import Link from "next/link";

export default async function VisitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userRecord } = await supabase.from("users")
    .select("organisation_id, role").eq("id", user!.id).single();

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const { data: visits } = await supabase
    .from("visits")
    .select("*, clients(first_name, last_name, photo_url, dnr_status), users(first_name, last_name)")
    .eq("organisation_id", userRecord?.organisation_id)
    .gte("scheduled_start", weekStart.toISOString())
    .lte("scheduled_start", weekEnd.toISOString())
    .order("scheduled_start");

  // Group by day
  const byDay: Record<string, typeof visits> = {};
  for (const visit of visits || []) {
    const day = new Date(String(visit.scheduled_start)).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "short"
    });
    if (!byDay[day]) byDay[day] = [];
    byDay[day]!.push(visit);
  }

  const statusVariant = (s: string) => {
    if (s === "completed") return "green";
    if (s === "missed") return "red";
    if (s === "in_progress") return "forest";
    return "slate";
  };

  return (
    <div>
      <CRPageHeader
        title="Visit Schedule"
        subtitle="This week's care visits"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
        action={
          <Link href="/visits/new" className="cr-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <Plus size={16} /> Schedule visit
          </Link>
        }
      />

      {Object.keys(byDay).length === 0 ? (
        <CREmptyState
          icon={<Calendar className="text-cr-slate" size={40} />}
          title="No visits this week"
          description="Schedule visits using the rota builder"
          action={{ label: "Go to Rota", href: "/rota" }}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(byDay).map(([day, dayVisits]) => (
            <div key={day}>
              <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-3">{day}</h2>
              <div className="space-y-2">
                {(dayVisits || []).map((visit) => {
                  const client = visit.clients as Record<string, unknown> | null;
                  const carer = visit.users as Record<string, string> | null;
                  return (
                    <CRCard key={String(visit.id)} hover>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <CRAvatar
                            src={String(client?.photo_url || "")}
                            name={`${client?.first_name} ${client?.last_name}`}
                            size="md"
                          />
                          {Boolean(client?.dnr_status) && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-cr-red rounded-full" title="DNR" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-body font-medium text-cr-charcoal">
                              {String(client?.first_name)} {String(client?.last_name)}
                            </p>
                            <CRBadge variant={statusVariant(String(visit.status))}>
                              {String(visit.status)}
                            </CRBadge>
                          </div>
                          <p className="text-xs text-cr-slate">
                            {formatTimeUK(String(visit.scheduled_start))} — {formatTimeUK(String(visit.scheduled_end))}
                            {carer && ` · ${carer.first_name} ${carer.last_name}`}
                          </p>
                        </div>
                      </div>
                    </CRCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
