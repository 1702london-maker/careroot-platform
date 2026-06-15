import { createClient } from "@/lib/supabase/server";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: userRecord }, ] = await Promise.all([
    supabase.from("users").select("*, organisations(*)").eq("id", user.id).single(),
  ]);

  const org = userRecord?.organisations as Record<string, unknown> | null;

  return (
    <div>
      <CRPageHeader
        title="Settings"
        subtitle="Manage your organisation, billing, and integrations"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
      />
      <SettingsTabs user={userRecord} organisation={org} />
    </div>
  );
}
