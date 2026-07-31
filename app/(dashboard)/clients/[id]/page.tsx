import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { CRAvatar } from "@/components/ui/CRAvatar";
import { CRBadge } from "@/components/ui/CRBadge";
import { riskVariant, statusVariant } from "@/lib/badge-variants";
import { ClientTabs } from "@/components/clients/ClientTabs";
import { formatDateTimeUK, formatDateUK, getDaysSince } from "@/lib/utils";
import { Clock, FileText, Phone, MapPin, User2 } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: sessionUser } = await supabase
    .from("users")
    .select("organisation_id, role")
    .eq("id", user.id)
    .single();

  if (!sessionUser?.organisation_id) notFound();
  const canManageEmergencyAccess = ["org_admin", "superadmin"].includes(String(sessionUser.role));

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("organisation_id", sessionUser.organisation_id)
    .single();

  if (error || !client) notFound();

  const { data: orgStaff } = await supabase
    .from("users")
    .select("id")
    .eq("organisation_id", sessionUser.organisation_id);
  const orgStaffIds = (orgStaff ?? []).map((staff) => staff.id);

  const [
    { data: carePlans },
    { data: medications },
    { data: recentVisits },
    { data: incidents },
    { data: riskAssessments },
    { data: nutritionProfile },
    { data: emergencyToken },
    { data: familyAccess },
    { data: bodyMapInjuries },
    { data: recentShiftLogs },
    { data: clientDocuments },
    { data: familyBriefings },
  ] = await Promise.all([
    supabase.from("care_plans").select("*").eq("client_id", id).eq("organisation_id", sessionUser.organisation_id).order("created_at", { ascending: false }),
    supabase.from("medications").select("*").eq("client_id", id).eq("organisation_id", sessionUser.organisation_id).eq("is_active", true).order("name"),
    supabase.from("visits").select("*, users(first_name, last_name)").eq("client_id", id).eq("organisation_id", sessionUser.organisation_id).order("scheduled_start", { ascending: false }).limit(20),
    supabase.from("incidents").select("*").eq("client_id", id).eq("organisation_id", sessionUser.organisation_id).order("reported_at", { ascending: false }).limit(10),
    supabase.from("risk_assessments").select("*").eq("client_id", id).eq("organisation_id", sessionUser.organisation_id).order("created_at", { ascending: false }).limit(1),
    supabase.from("nutrition_profiles").select("*").eq("client_id", id).eq("organisation_id", sessionUser.organisation_id).maybeSingle(),
    canManageEmergencyAccess
      ? supabase.from("emergency_access_tokens").select("token, pin").eq("client_id", id).eq("organisation_id", sessionUser.organisation_id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("family_access").select("*, users!family_access_user_id_fkey(first_name, last_name, email, phone)").eq("client_id", id).eq("organisation_id", sessionUser.organisation_id),
    supabase.from("body_map_injuries").select("*").eq("client_id", id).eq("organisation_id", sessionUser.organisation_id).order("created_at"),
    orgStaffIds.length > 0
      ? supabase.from("shift_logs").select("id, log_type, content, transcription, server_timestamp, within_approved_radius, users(first_name, last_name)").eq("client_id", id).in("staff_id", orgStaffIds).order("server_timestamp", { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
    supabase.from("client_documents").select("*").eq("client_id", id).eq("organisation_id", sessionUser.organisation_id).order("uploaded_at", { ascending: false }),
    supabase.from("family_briefings").select("*").eq("client_id", id).eq("organisation_id", sessionUser.organisation_id).order("created_at", { ascending: false }).limit(10),
  ]);

  const address = client.address as Record<string, string> | null;
  const gpDetails = client.gp_details as Record<string, string> | null;

  return (
    <div>
      {/* DNR banner — always first if set */}
      {Boolean(client.dnr_status) && (
        <CRAlertBanner
          variant="red"
          title="⚠️ DNR ORDER IN PLACE — Do Not Resuscitate"
          description="This client has a valid Do Not Resuscitate order. Confirm with GP before any resuscitation attempt."
          className="mb-4"
        />
      )}

      {/* Allergies banner */}
      {client.allergies && Array.isArray(client.allergies) && client.allergies.some((a: { severity: string }) => a.severity === "anaphylactic") && (
        <CRAlertBanner
          variant="red"
          title="ANAPHYLACTIC ALLERGY"
          description={`Carries EpiPen: ${(client.allergies as Array<{ name: string; severity: string }>).filter((a) => a.severity === "anaphylactic").map((a) => a.name).join(", ")}`}
          className="mb-4"
        />
      )}

      <CRPageHeader
        title={`${client.first_name} ${client.last_name}`}
        subtitle={`NHS: ${client.nhs_number || "Not recorded"} · Added ${getDaysSince(client.created_at)} days ago`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clients", href: "/clients" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <CRBadge variant={riskVariant(client.risk_level)}>{client.risk_level} risk</CRBadge>
            <CRBadge variant={statusVariant(client.status)}>{client.status}</CRBadge>
          </div>
        }
      />

      {/* Client header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <CRAvatar
            name={`${client.first_name} ${client.last_name}`}
            size="xl"
          />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-body font-medium text-cr-slate uppercase tracking-wide mb-1">Date of Birth</p>
              <p className="text-sm font-body text-cr-charcoal">{formatDateUK(client.date_of_birth)}</p>
            </div>
            {client.phone && (
              <div>
                <p className="text-xs font-body font-medium text-cr-slate uppercase tracking-wide mb-1">Phone</p>
                <a href={`tel:${client.phone}`} className="text-sm font-body text-cr-forest flex items-center gap-1">
                  <Phone size={12} /> {client.phone}
                </a>
              </div>
            )}
            {address && (
              <div>
                <p className="text-xs font-body font-medium text-cr-slate uppercase tracking-wide mb-1">Address</p>
                <p className="text-sm font-body text-cr-charcoal flex items-start gap-1">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  {[address.line1, address.city, address.postcode].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
            {gpDetails && (
              <div>
                <p className="text-xs font-body font-medium text-cr-slate uppercase tracking-wide mb-1">GP</p>
                <p className="text-sm font-body text-cr-charcoal flex items-center gap-1">
                  <User2 size={12} /> {gpDetails.name} · {gpDetails.surgery}
                </p>
              </div>
            )}
            {client.cultural_background && (
              <div>
                <p className="text-xs font-body font-medium text-cr-slate uppercase tracking-wide mb-1">Cultural Background</p>
                <p className="text-sm font-body text-cr-charcoal">{client.cultural_background}</p>
              </div>
            )}
            {client.language_preferences && (
              <div>
                <p className="text-xs font-body font-medium text-cr-slate uppercase tracking-wide mb-1">Languages</p>
                <p className="text-sm font-body text-cr-charcoal">{client.language_preferences}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-cr-forest" />
          <h2 className="font-display text-lg font-semibold text-cr-charcoal">Recent Care Notes</h2>
        </div>
        {!recentShiftLogs?.length ? (
          <p className="text-sm font-body text-cr-slate">No care notes have been saved for this client yet.</p>
        ) : (
          <div className="space-y-3">
            {recentShiftLogs.map((log) => {
              const staff = log.users as unknown as { first_name: string; last_name: string } | null;
              return (
                <div key={log.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-body text-cr-slate">
                      <Clock size={12} />
                      <span>{formatDateTimeUK(log.server_timestamp)}</span>
                      <span>by {staff ? `${staff.first_name} ${staff.last_name}` : "staff"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CRBadge variant="info">{String(log.log_type).replace(/_/g, " ")}</CRBadge>
                      {log.within_approved_radius === true && <CRBadge variant="success">Location verified</CRBadge>}
                    </div>
                  </div>
                  <p className="text-sm font-body leading-relaxed text-cr-charcoal">{log.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <ClientTabs
        client={{ ...client, bodyMapInjuries: bodyMapInjuries || [] }}
        carePlans={carePlans || []}
        medications={medications || []}
        recentVisits={recentVisits || []}
        incidents={incidents || []}
        riskAssessment={riskAssessments?.[0] || null}
        nutritionProfile={nutritionProfile}
        emergencyToken={emergencyToken?.token || null}
        emergencyPin={emergencyToken?.pin || null}
        canManageEmergencyAccess={canManageEmergencyAccess}
        familyAccess={familyAccess || []}
        familyBriefings={familyBriefings || []}
        clientDocuments={clientDocuments || []}
      />
    </div>
  );
}
