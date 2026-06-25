import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRAvatar } from "@/components/ui/CRAvatar";
import { UtensilsCrossed, AlertTriangle, TrendingDown, CheckCircle, Plus, Droplets } from "lucide-react";
import Link from "next/link";

export default async function NutritionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id").eq("id", user.id).single();

  const orgId = userRecord?.organisation_id;

  const [
    { data: recentMeals },
    { data: profiles },
    { data: aiFlags },
  ] = await Promise.all([
    supabase.from("meal_records")
      .select("*, clients(first_name, last_name, photo_url)")
      .eq("clients.organisation_id", orgId)
      .order("recorded_at", { ascending: false })
      .limit(20),
    supabase.from("nutrition_profiles")
      .select("*, clients(first_name, last_name, photo_url)")
      .eq("organisation_id", orgId),
    supabase.from("ai_risk_flags")
      .select("*, clients(first_name, last_name)")
      .eq("organisation_id", orgId)
      .eq("status", "open")
      .ilike("description", "%appetite%")
      .limit(5),
  ]);

  const lowIntakeCount = recentMeals?.filter(m =>
    m.consumption_level === "little" || m.consumption_level === "refused"
  ).length ?? 0;

  const totalMeals = recentMeals?.length ?? 0;
  const profilesCount = profiles?.length ?? 0;

  return (
    <div>
      <CRPageHeader
        title="Nutrition & Meals"
        subtitle="Meal records, preferences, and intake monitoring"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
        action={
          <Link href="/clients" className="flex items-center gap-1.5 text-sm font-body font-semibold bg-cr-forest text-white px-4 py-2 rounded-btn hover:bg-cr-sage transition-colors">
            <Plus size={14} />
            Add Meal Record
          </Link>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Nutrition Profiles", value: profilesCount, icon: <UtensilsCrossed size={18} />, color: "text-cr-forest" },
          { label: "Meals Recorded (7d)", value: totalMeals, icon: <CheckCircle size={18} />, color: "text-green-600" },
          { label: "Low Intake Alerts", value: lowIntakeCount, icon: <TrendingDown size={18} />, color: lowIntakeCount > 0 ? "text-cr-red" : "text-cr-slate" },
          { label: "AI Appetite Flags", value: aiFlags?.length ?? 0, icon: <AlertTriangle size={18} />, color: aiFlags?.length ? "text-cr-amber" : "text-cr-slate" },
        ].map((stat) => (
          <CRCard key={stat.label} className="flex items-center gap-3">
            <div className={`${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-xl font-display font-semibold text-cr-charcoal">{stat.value}</p>
              <p className="text-xs font-body text-cr-slate">{stat.label}</p>
            </div>
          </CRCard>
        ))}
      </div>

      {/* AI appetite flags */}
      {(aiFlags?.length ?? 0) > 0 && (
        <div className="mb-6">
          <CRCard noPadding>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-display text-base font-semibold text-cr-charcoal flex items-center gap-2">
                <AlertTriangle size={16} className="text-cr-amber" />
                AI Appetite Alerts
              </h2>
              <Link href="/ai/risk-flags" className="text-xs font-body text-cr-forest hover:text-cr-sage transition-colors">View all flags</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {aiFlags?.map((flag) => {
                const client = flag.clients as Record<string, string> | null;
                return (
                  <div key={flag.id} className="flex items-start gap-4 px-5 py-3.5">
                    <CRAvatar firstName={client?.first_name} lastName={client?.last_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-medium text-cr-charcoal">{client?.first_name} {client?.last_name}</p>
                      <p className="text-xs font-body text-cr-slate mt-0.5 line-clamp-2">{flag.description}</p>
                    </div>
                    <CRBadge variant={flag.severity === "high" || flag.severity === "critical" ? "red" : "amber"} size="sm">
                      {flag.severity}
                    </CRBadge>
                  </div>
                );
              })}
            </div>
          </CRCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent meal records */}
        <CRCard noPadding>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="font-display text-base font-semibold text-cr-charcoal">Recent Meal Records</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {!recentMeals?.length ? (
              <div className="py-10 text-center">
                <UtensilsCrossed size={32} className="mx-auto text-cr-slate opacity-30 mb-2" />
                <p className="text-sm font-body text-cr-slate">No meal records yet</p>
                <p className="text-xs font-body text-cr-slate mt-1">Carers record meals during visits</p>
              </div>
            ) : (
              recentMeals.slice(0, 10).map((record) => {
                const client = record.clients as Record<string, string> | null;
                const consumptionColors: Record<string, string> = {
                  all: "text-green-600 bg-green-50",
                  most: "text-cr-forest bg-cr-mint",
                  half: "text-amber-600 bg-amber-50",
                  little: "text-cr-red bg-red-50",
                  refused: "text-cr-red bg-red-50",
                };
                const cls = consumptionColors[record.consumption_level] ?? "text-cr-slate bg-gray-100";
                return (
                  <div key={record.id} className="flex items-center gap-3 px-5 py-3">
                    <CRAvatar firstName={client?.first_name} lastName={client?.last_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-medium text-cr-charcoal truncate">
                        {client?.first_name} {client?.last_name}
                      </p>
                      <p className="text-xs font-body text-cr-slate capitalize">
                        {record.meal_time?.replace("_", " ")} · {record.meal_name ?? "Meal"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {record.fluid_intake_ml && (
                        <span className="flex items-center gap-1 text-xs font-body text-blue-600">
                          <Droplets size={12} />{record.fluid_intake_ml}ml
                        </span>
                      )}
                      <span className={`text-xs font-body font-semibold px-2 py-0.5 rounded-full capitalize ${cls}`}>
                        {record.consumption_level}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CRCard>

        {/* Nutrition profiles */}
        <CRCard noPadding>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="font-display text-base font-semibold text-cr-charcoal">Nutrition Profiles</h2>
            <Link href="/clients" className="text-xs font-body text-cr-forest hover:text-cr-sage transition-colors">Edit via client record</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!profiles?.length ? (
              <div className="py-10 text-center">
                <UtensilsCrossed size={32} className="mx-auto text-cr-slate opacity-30 mb-2" />
                <p className="text-sm font-body text-cr-slate">No nutrition profiles set up</p>
                <p className="text-xs font-body text-cr-slate mt-1">Add nutrition details in each client&rsquo;s profile</p>
              </div>
            ) : (
              profiles.map((profile) => {
                const client = profile.clients as Record<string, string> | null;
                const allergies = Array.isArray(profile.allergies) ? profile.allergies : [];
                return (
                  <Link key={profile.id} href={`/clients/${profile.client_id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <CRAvatar firstName={client?.first_name} lastName={client?.last_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-medium text-cr-charcoal truncate">
                        {client?.first_name} {client?.last_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {profile.diet_type && (
                          <span className="text-xs font-body text-cr-slate capitalize">{profile.diet_type}</span>
                        )}
                        {profile.texture_requirement && profile.texture_requirement !== "normal" && (
                          <CRBadge variant="amber" size="sm" className="capitalize">{profile.texture_requirement}</CRBadge>
                        )}
                        {profile.thickened_fluids && (
                          <CRBadge variant="blue" size="sm">Thickened fluids</CRBadge>
                        )}
                        {allergies.length > 0 && (
                          <CRBadge variant="red" size="sm">{allergies.length} allerg{allergies.length === 1 ? "y" : "ies"}</CRBadge>
                        )}
                      </div>
                    </div>
                    {profile.fluid_requirement_ml && (
                      <span className="text-xs font-body text-blue-600 flex items-center gap-1 flex-shrink-0">
                        <Droplets size={12} />{profile.fluid_requirement_ml}ml/day
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </CRCard>
      </div>
    </div>
  );
}
