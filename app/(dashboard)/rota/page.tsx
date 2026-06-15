import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

export default async function RotaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id").eq("id", user.id).single();
  const orgId = userRecord?.organisation_id;

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + diffToMon);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { data: visits } = await supabase
    .from("visits")
    .select("*, clients(first_name, last_name), users(first_name, last_name)")
    .eq("organisation_id", orgId)
    .gte("scheduled_start", weekStart.toISOString())
    .lte("scheduled_start", weekEnd.toISOString())
    .order("scheduled_start");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const byDay: Record<string, typeof visits> = {};
  for (const d of days) byDay[d] = [];

  for (const visit of visits || []) {
    const dt = new Date(String(visit.scheduled_start));
    const dayName = dt.toLocaleDateString("en-GB", { weekday: "long" });
    if (byDay[dayName]) byDay[dayName]!.push(visit);
  }

  const statusVariant = (s: string) => {
    if (s === "completed") return "green";
    if (s === "missed") return "red";
    if (s === "in_progress") return "forest";
    return "slate";
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const weekLabel = `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  const totalVisits = visits?.length ?? 0;

  return (
    <div>
      <CRPageHeader
        title="Weekly Rota"
        subtitle={weekLabel}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
        action={
          <Link href="/visits/new" className="cr-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            + Schedule Visit
          </Link>
        }
      />

      {totalVisits === 0 ? (
        <CREmptyState
          icon={<CalendarDays className="text-cr-slate" size={40} />}
          title="No visits scheduled this week"
          description="Use the schedule visit button to add visits to the rota"
          action={{ label: "Schedule a Visit", href: "/visits/new" }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((day) => {
            const dayVisits = byDay[day] || [];
            const dayIndex = days.indexOf(day);
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + dayIndex);
            const isToday = dayDate.toDateString() === today.toDateString();
            return (
              <div key={day} className="min-h-[120px]">
                <div className={`text-center py-2 mb-2 rounded-lg ${isToday ? "bg-cr-forest text-white" : "bg-cr-mint"}`}>
                  <p className={`text-xs font-body font-semibold ${isToday ? "text-white" : "text-cr-charcoal"}`}>{day.slice(0, 3)}</p>
                  <p className={`text-lg font-display font-semibold ${isToday ? "text-white" : "text-cr-charcoal"}`}>
                    {dayDate.getDate()}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {dayVisits.length === 0 ? (
                    <p className="text-xs text-cr-slate text-center py-4">—</p>
                  ) : (
                    dayVisits.map((visit) => {
                      const client = visit.clients as Record<string, string> | null;
                      const carer = visit.users as Record<string, string> | null;
                      return (
                        <div
                          key={String(visit.id)}
                          className="bg-white border border-cr-mint rounded-lg p-2 shadow-sm"
                        >
                          <p className="text-xs font-body font-semibold text-cr-charcoal truncate">
                            {client?.first_name} {client?.last_name}
                          </p>
                          <p className="text-xs text-cr-slate">
                            {fmt(String(visit.scheduled_start))}–{fmt(String(visit.scheduled_end))}
                          </p>
                          {carer && (
                            <p className="text-xs text-cr-slate truncate">{carer.first_name}</p>
                          )}
                          <CRBadge variant={statusVariant(String(visit.status))} size="sm">
                            {String(visit.status)}
                          </CRBadge>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
