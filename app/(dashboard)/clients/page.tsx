import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge, riskVariant, statusVariant } from "@/components/ui/CRBadge";
import { CRAvatar } from "@/components/ui/CRAvatar";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { Users, Plus, Search } from "lucide-react";
import { formatDateUK } from "@/lib/utils";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; risk?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  const orgId = userRecord?.organisation_id;
  const params = await searchParams;

  let query = supabase
    .from("clients")
    .select("*, users!clients_organisation_id_fkey(first_name, last_name)")
    .eq("organisation_id", orgId)
    .order("last_name");

  if (params.q) {
    query = query.or(`first_name.ilike.%${params.q}%,last_name.ilike.%${params.q}%,nhs_number.ilike.%${params.q}%`);
  }
  if (params.status) query = query.eq("status", params.status);
  if (params.risk) query = query.eq("risk_level", params.risk);

  const { data: clients } = await query;

  return (
    <div>
      <CRPageHeader
        title="Clients"
        subtitle={`${clients?.length ?? 0} total`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
        action={
          <Link href="/clients/new" className="cr-btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={16} />
            Add Client
          </Link>
        }
      />

      {/* Search and filters */}
      <CRCard className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cr-slate" />
            <form>
              <input
                name="q"
                defaultValue={params.q}
                type="search"
                placeholder="Search by name or NHS number..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cr-forest/30 focus:border-cr-forest"
              />
            </form>
          </div>
          <div className="flex gap-2">
            {["active", "inactive", "hospital", "deceased"].map((s) => (
              <Link
                key={s}
                href={`/clients?status=${s}`}
                className={`px-3 py-2 rounded-lg text-xs font-body font-medium border transition-colors capitalize
                  ${params.status === s ? "bg-cr-forest text-white border-cr-forest" : "bg-white text-cr-slate border-gray-200 hover:border-cr-forest hover:text-cr-forest"}`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </CRCard>

      {/* Client list */}
      {clients?.length === 0 ? (
        <CREmptyState
          icon={<Users size={48} />}
          title="No clients yet"
          description="Add your first client to get started with Careroot."
          action={
            <Link href="/clients/new" className="cr-btn-primary text-sm">
              Add your first client
            </Link>
          }
        />
      ) : (
        <CRCard noPadding>
          <div className="divide-y divide-gray-50">
            {clients?.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group"
              >
                <div className="relative">
                  <CRAvatar
                    src={client.avatar_url}
                    firstName={client.first_name}
                    lastName={client.last_name}
                    size="md"
                  />
                  {Boolean(client.dnr_status) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-cr-red rounded-full border-2 border-white" title="DNR" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-body font-semibold text-cr-charcoal group-hover:text-cr-forest transition-colors">
                      {client.first_name} {client.last_name}
                    </p>
                    {Boolean(client.dnr_status) && (
                      <CRBadge variant="red" size="sm">DNR</CRBadge>
                    )}
                  </div>
                  <p className="text-xs font-body text-cr-slate">
                    DOB: {formatDateUK(client.date_of_birth)}
                    {client.nhs_number && ` · NHS: ${client.nhs_number}`}
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-2">
                  <CRBadge variant={riskVariant(client.risk_level)} size="sm">
                    {client.risk_level} risk
                  </CRBadge>
                  <CRBadge variant={statusVariant(client.status)} size="sm">
                    {client.status}
                  </CRBadge>
                  {!client.onboarding_complete && (
                    <CRBadge variant="amber" size="sm">Setup incomplete</CRBadge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CRCard>
      )}
    </div>
  );
}
