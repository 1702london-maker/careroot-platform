import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";

export default async function PayrollSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();
  const orgId = userRecord?.organisation_id;

  const { data: carers } = await supabase
    .from("users")
    .select("id, first_name, last_name, role")
    .eq("organisation_id", orgId)
    .eq("role", "carer")
    .eq("is_active", true)
    .order("first_name");

  const { data: payRates } = await supabase
    .from("carer_pay_rates")
    .select("*, users!carer_pay_rates_user_id_fkey(first_name, last_name)")
    .eq("organisation_id", orgId)
    .is("effective_to", null)
    .order("created_at", { ascending: false });

  const rateByCarerId = Object.fromEntries((payRates ?? []).map((r) => [r.user_id, r]));

  return (
    <div className="max-w-4xl">
      <CRPageHeader title="Pay Settings" subtitle="Configure carer pay rates and payroll rules" />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-body font-semibold text-cr-charcoal">Carer Pay Rates</h2>
          <p className="text-xs text-cr-slate mt-0.5">Current active pay rate per carer</p>
        </div>
        <table className="w-full text-sm font-body">
          <thead className="bg-cr-mint">
            <tr>{["Carer", "Hourly Rate", "Overtime Rate", "Weekend Rate", "Travel/Mile", "Effective From"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-cr-slate uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(carers ?? []).map((c) => {
              const rate = rateByCarerId[c.id];
              return (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-cr-charcoal">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-3 text-cr-charcoal">{rate ? `£${Number(rate.hourly_rate).toFixed(2)}` : <span className="text-cr-slate italic text-xs">Not set</span>}</td>
                  <td className="px-4 py-3 text-cr-slate">{rate?.overtime_rate ? `£${Number(rate.overtime_rate).toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3 text-cr-slate">{rate?.weekend_rate ? `£${Number(rate.weekend_rate).toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3 text-cr-slate">{rate?.travel_rate_per_mile ? `£${Number(rate.travel_rate_per_mile).toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3 text-cr-slate text-xs">{rate ? new Date(rate.effective_from).toLocaleDateString("en-GB") : "—"}</td>
                </tr>
              );
            })}
            {(!carers || carers.length === 0) && (
              <tr><td colSpan={6} className="text-center py-10 text-sm text-cr-slate">No active carers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-body font-semibold text-cr-charcoal mb-4">Pay Rules</h2>
        <div className="grid grid-cols-2 gap-5 text-sm font-body">
          {[["Overtime threshold", "40 hours/week"], ["Overtime multiplier", "1.5×"], ["Weekend pay", "Saturday & Sunday"], ["Pay frequency", "Monthly"], ["Travel pay", "Enabled"], ["Time rounding", "15 minutes"]].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-cr-slate">{label}</span>
              <span className="font-medium text-cr-charcoal">{value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-cr-slate mt-4">Pay rule editing coming in the next release.</p>
      </div>
    </div>
  );
}
