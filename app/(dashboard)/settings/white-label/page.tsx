import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WhiteLabelSettings } from "@/components/settings/WhiteLabelSettings";

export default async function WhiteLabelSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organisation_id, organisations(*)")
    .eq("id", user.id)
    .single();

  if (userRecord?.role !== "org_admin") redirect("/dashboard");

  const org = userRecord?.organisations as unknown as Record<string, unknown> | null;
  const plan = org?.plan as string;
  const isWhiteLabel = !!org?.white_label;

  if (plan !== "enterprise" && !isWhiteLabel) redirect("/settings/organisation");

  const { data: domainRecord } = await supabase
    .from("white_label_domains")
    .select("*")
    .eq("organisation_id", userRecord.organisation_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <WhiteLabelSettings
      org={org ?? {}}
      orgId={userRecord.organisation_id}
      domainRecord={domainRecord}
    />
  );
}
