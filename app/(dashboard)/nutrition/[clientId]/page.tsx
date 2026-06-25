import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRAvatar } from "@/components/ui/CRAvatar";
import { NutritionClientCharts } from "@/components/nutrition/NutritionClientCharts";
import {
  Droplets, UtensilsCrossed, AlertTriangle, CheckCircle,
  ArrowLeft, Heart, Info
} from "lucide-react";
import Link from "next/link";

interface Props { params: Promise<{ clientId: string }> }

const CONSUMPTION_COLORS: Record<string, string> = {
  all: "bg-green-100 text-green-800",
  most: "bg-cr-mint text-cr-forest",
  half: "bg-amber-100 text-amber-800",
  little: "bg-red-100 text-cr-red",
  refused: "bg-red-100 text-cr-red",
};

const MEAL_TIME_ORDER = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "evening_snack"];

export default async function NutritionClientPage({ params }: Props) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id").eq("id", user.id).single();

  const [
    { data: client },
    { data: profile },
    { data: preferences },
    { data: records },
  ] = await Promise.all([
    supabase.from("clients")
      .select("id, first_name, last_name, photo_url, date_of_birth, risk_level, organisation_id")
      .eq("id", clientId)
      .eq("organisation_id", userRecord?.organisation_id)
      .single(),
    supabase.from("nutrition_profiles")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle(),
    supabase.from("meal_preferences")
      .select("*")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .order("meal_time"),
    supabase.from("meal_records")
      .select("*")
      .eq("client_id", clientId)
      .order("recorded_at", { ascending: false })
      .limit(90),
  ]);

  if (!client) notFound();

  const allergies: string[] = Array.isArray(profile?.allergies) ? profile.allergies as string[] : [];
  const intolerances: string[] = Array.isArray(profile?.intolerances) ? profile.intolerances as string[] : [];
  const likedFoods: string[] = Array.isArray(profile?.liked_foods) ? profile.liked_foods as string[] : [];
  const dislikedFoods: string[] = Array.isArray(profile?.disliked_foods) ? profile.disliked_foods as string[] : [];
  const supplements: string[] = Array.isArray(profile?.supplements) ? profile.supplements as string[] : [];

  // Consumption stats (last 30 records)
  const recent = records?.slice(0, 30) ?? [];
  const totalRecords = recent.length;
  const goodIntake = recent.filter(r => r.consumption_level === "all" || r.consumption_level === "most").length;
  const poorIntake = recent.filter(r => r.consumption_level === "little" || r.consumption_level === "refused").length;
  const avgFluid = recent.length
    ? Math.round(recent.reduce((s, r) => s + (r.fluid_intake_ml || 0), 0) / recent.length)
    : 0;

  // Group preferences by meal time
  const prefsByTime: Record<string, typeof preferences> = {};
  preferences?.forEach(p => {
    prefsByTime[p.meal_time] = prefsByTime[p.meal_time] ?? [];
    prefsByTime[p.meal_time]!.push(p);
  });

  return (
    <div>
      <CRPageHeader
        title={`${client.first_name} ${client.last_name} — Nutrition`}
        subtitle="Nutrition profile, meal preferences and intake history"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Nutrition", href: "/nutrition" },
        ]}
        action={
          <Link href={`/clients/${clientId}`} className="flex items-center gap-1.5 text-sm font-body font-semibold border border-cr-forest text-cr-forest px-4 py-2 rounded-btn hover:bg-cr-mint transition-colors">
            View full profile
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — profile + prefs */}
        <div className="space-y-6">

          {/* Client card */}
          <CRCard>
            <div className="flex items-center gap-3 mb-4">
              <CRAvatar firstName={client.first_name} lastName={client.last_name} src={client.photo_url} size="lg" />
              <div>
                <p className="font-body font-semibold text-cr-charcoal">{client.first_name} {client.last_name}</p>
                <p className="text-xs font-body text-cr-slate">
                  {client.date_of_birth ? `${Math.floor((Date.now() - new Date(client.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs` : "Age unknown"}
                </p>
              </div>
            </div>
            {!profile ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={14} className="text-cr-amber mt-0.5 flex-shrink-0" />
                <p className="text-xs font-body text-amber-800">No nutrition profile set. Add one via the client&rsquo;s Nutrition tab.</p>
              </div>
            ) : (
              <div className="space-y-2.5 text-sm font-body">
                {[
                  { label: "Diet type", value: profile.diet_type ?? "—" },
                  { label: "Texture", value: profile.texture_requirement ?? "normal" },
                  { label: "Fluid req.", value: profile.fluid_requirement_ml ? `${profile.fluid_requirement_ml}ml/day` : "Not set" },
                  { label: "Thickened fluids", value: profile.thickened_fluids ? `Yes — ${profile.thickened_fluid_level ?? ""}` : "No" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-cr-slate">{label}</span>
                    <span className="text-cr-charcoal font-medium capitalize">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </CRCard>

          {/* Alerts */}
          {(allergies.length > 0 || intolerances.length > 0) && (
            <CRCard>
              <h3 className="font-display text-sm font-semibold text-cr-charcoal mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-cr-red" /> Allergens & Intolerances
              </h3>
              {allergies.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Allergies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allergies.map(a => <CRBadge key={a} variant="red" size="sm">{a}</CRBadge>)}
                  </div>
                </div>
              )}
              {intolerances.length > 0 && (
                <div>
                  <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Intolerances</p>
                  <div className="flex flex-wrap gap-1.5">
                    {intolerances.map(i => <CRBadge key={i} variant="amber" size="sm">{i}</CRBadge>)}
                  </div>
                </div>
              )}
            </CRCard>
          )}

          {/* Likes/dislikes */}
          {(likedFoods.length > 0 || dislikedFoods.length > 0) && (
            <CRCard>
              <h3 className="font-display text-sm font-semibold text-cr-charcoal mb-3 flex items-center gap-2">
                <Heart size={14} className="text-cr-forest" /> Food Preferences
              </h3>
              {likedFoods.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Likes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {likedFoods.map(f => <CRBadge key={f} variant="green" size="sm">{f}</CRBadge>)}
                  </div>
                </div>
              )}
              {dislikedFoods.length > 0 && (
                <div>
                  <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5">Dislikes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dislikedFoods.map(f => <CRBadge key={f} variant="slate" size="sm">{f}</CRBadge>)}
                  </div>
                </div>
              )}
              {profile?.cultural_notes && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3 flex items-start gap-2">
                  <Info size={13} className="text-cr-slate mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-body text-cr-slate leading-relaxed">{profile.cultural_notes}</p>
                </div>
              )}
            </CRCard>
          )}

          {/* Supplements */}
          {supplements.length > 0 && (
            <CRCard>
              <h3 className="font-display text-sm font-semibold text-cr-charcoal mb-3">Supplements</h3>
              <div className="flex flex-wrap gap-1.5">
                {supplements.map(s => <CRBadge key={s} variant="blue" size="sm">{s}</CRBadge>)}
              </div>
            </CRCard>
          )}
        </div>

        {/* Right — stats, charts, records */}
        <div className="lg:col-span-2 space-y-6">

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Records (30d)", value: totalRecords, icon: <UtensilsCrossed size={16} />, color: "text-cr-forest" },
              { label: "Good intake", value: `${totalRecords ? Math.round((goodIntake / totalRecords) * 100) : 0}%`, icon: <CheckCircle size={16} />, color: "text-green-600" },
              { label: "Poor intake", value: poorIntake, icon: <AlertTriangle size={16} />, color: poorIntake > 3 ? "text-cr-red" : "text-cr-slate" },
              { label: "Avg fluid/meal", value: avgFluid ? `${avgFluid}ml` : "—", icon: <Droplets size={16} />, color: "text-blue-600" },
            ].map(stat => (
              <CRCard key={stat.label} className="flex items-center gap-3 py-4">
                <span className={stat.color}>{stat.icon}</span>
                <div>
                  <p className="text-lg font-display font-semibold text-cr-charcoal">{stat.value}</p>
                  <p className="text-xs font-body text-cr-slate">{stat.label}</p>
                </div>
              </CRCard>
            ))}
          </div>

          {/* Charts */}
          {records && records.length > 0 && (
            <NutritionClientCharts records={records} fluidTarget={profile?.fluid_requirement_ml ?? 0} />
          )}

          {/* Meal preferences by time */}
          {preferences && preferences.length > 0 && (
            <CRCard noPadding>
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h3 className="font-display text-base font-semibold text-cr-charcoal">Meal Plan</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {MEAL_TIME_ORDER.filter(t => prefsByTime[t]?.length).map(mealTime => (
                  <div key={mealTime} className="px-5 py-4">
                    <p className="text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-2 capitalize">
                      {mealTime.replace("_", " ")}
                    </p>
                    <div className="space-y-2">
                      {prefsByTime[mealTime]!.map(pref => (
                        <div key={pref.id} className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-body font-medium text-cr-charcoal">{pref.name}</p>
                            {pref.warnings && (
                              <p className="text-xs font-body text-cr-red mt-0.5 flex items-center gap-1">
                                <AlertTriangle size={11} /> {pref.warnings}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {pref.is_favourite && <CRBadge variant="gold" size="sm">Favourite</CRBadge>}
                            <CRBadge variant="slate" size="sm" className="capitalize">{pref.frequency?.replace("_", " ")}</CRBadge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CRCard>
          )}

          {/* Recent meal records */}
          <CRCard noPadding>
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h3 className="font-display text-base font-semibold text-cr-charcoal">Recent Meal Records</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {!records?.length ? (
                <div className="py-10 text-center">
                  <UtensilsCrossed size={28} className="mx-auto text-cr-slate opacity-30 mb-2" />
                  <p className="text-sm font-body text-cr-slate">No meal records yet</p>
                </div>
              ) : (
                records.slice(0, 20).map(record => {
                  const cls = CONSUMPTION_COLORS[record.consumption_level] ?? "bg-gray-100 text-cr-slate";
                  return (
                    <div key={record.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-body font-medium text-cr-charcoal capitalize">
                            {record.meal_time?.replace("_", " ")}
                          </p>
                          {record.meal_name && (
                            <span className="text-xs font-body text-cr-slate">· {record.meal_name}</span>
                          )}
                        </div>
                        <p className="text-xs font-body text-cr-slate mt-0.5">
                          {new Date(record.recorded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {record.fluid_intake_ml && (
                          <span className="text-xs font-body text-blue-600 flex items-center gap-1">
                            <Droplets size={11} />{record.fluid_intake_ml}ml
                          </span>
                        )}
                        <span className={`text-xs font-body font-semibold px-2 py-0.5 rounded-full capitalize ${cls}`}>
                          {record.consumption_level}
                        </span>
                        {!!record.ai_flag && (
                          <AlertTriangle size={13} className="text-cr-amber" aria-label="AI flagged" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CRCard>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/nutrition" className="flex items-center gap-1.5 text-sm font-body text-cr-slate hover:text-cr-forest transition-colors">
          <ArrowLeft size={14} /> Back to Nutrition overview
        </Link>
      </div>
    </div>
  );
}
