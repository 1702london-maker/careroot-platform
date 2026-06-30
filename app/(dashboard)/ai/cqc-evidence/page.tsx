import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { CQCEvidenceDashboard } from "@/components/intelligence/CQCEvidenceDashboard";

export default async function CQCEvidencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users").select("organisation_id").eq("id", user.id).single();

  const { data: pack } = await supabase.from("cqc_evidence_packs")
    .select("*")
    .eq("organisation_id", userRecord!.organisation_id)
    .maybeSingle();

  return (
    <div>
      <CRPageHeader
        title="CQC Evidence Pack"
        subtitle="AI-scored compliance against the CQC Single Assessment Framework"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Intelligence" }]}
        action={<CRAIBadge />}
      />
      <CQCEvidenceDashboard pack={pack} />
    </div>
  );
}
