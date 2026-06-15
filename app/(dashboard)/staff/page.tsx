import { createClient } from "@/lib/supabase/server";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRAvatar } from "@/components/ui/CRAvatar";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { Users, Plus, Mail, Phone } from "lucide-react";
import Link from "next/link";

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userRecord } = await supabase.from("users")
    .select("organisation_id, role").eq("id", user!.id).single();

  if (!["org_admin", "manager", "coordinator", "superadmin"].includes(userRecord?.role || "")) {
    return <div className="text-cr-red p-4">Access denied</div>;
  }

  const { data: staff } = await supabase
    .from("users")
    .select("*")
    .eq("organisation_id", userRecord?.organisation_id)
    .neq("role", "family")
    .order("last_name");

  const roleVariant = (r: string) => {
    if (r === "org_admin") return "gold";
    if (r === "manager") return "forest";
    if (r === "coordinator") return "blue";
    if (r === "carer") return "green";
    return "slate";
  };

  const roleLabel = (r: string) => ({
    org_admin: "Admin",
    manager: "Manager",
    coordinator: "Coordinator",
    carer: "Carer",
    superadmin: "Super Admin",
  }[r] || r);

  return (
    <div>
      <CRPageHeader
        title="Staff Management"
        subtitle={`${staff?.length || 0} team members`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
        action={
          <Link href="/staff/invite" className="cr-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <Plus size={16} /> Invite staff
          </Link>
        }
      />

      {!staff || staff.length === 0 ? (
        <CREmptyState
          icon={<Users className="text-cr-slate" size={40} />}
          title="No staff members yet"
          description="Invite your team to get started"
          action={{ label: "Invite staff", href: "/staff/invite" }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <CRCard key={member.id} hover>
              <div className="flex items-center gap-3 mb-3">
                <CRAvatar
                  src={member.avatar_url}
                  name={`${member.first_name} ${member.last_name}`}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-cr-charcoal truncate">
                    {member.first_name} {member.last_name}
                  </p>
                  <CRBadge variant={roleVariant(member.role)}>{roleLabel(member.role)}</CRBadge>
                </div>
                <CRBadge variant={member.is_active ? "green" : "slate"}>
                  {member.is_active ? "Active" : "Inactive"}
                </CRBadge>
              </div>
              <div className="space-y-1.5">
                {member.email && (
                  <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-xs text-cr-slate hover:text-cr-forest">
                    <Mail size={12} /> {member.email}
                  </a>
                )}
                {member.phone && (
                  <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-xs text-cr-slate hover:text-cr-forest">
                    <Phone size={12} /> {member.phone}
                  </a>
                )}
              </div>
            </CRCard>
          ))}
        </div>
      )}
    </div>
  );
}
