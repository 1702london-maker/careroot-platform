import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { WhiteLabelProvider } from "@/components/providers/WhiteLabelProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("*, organisations(*)")
    .eq("id", user.id)
    .single();

  if (userRecord?.role === "family") {
    redirect("/family/login");
  }

  // First-login security: issued accounts must set their own password + accept terms.
  if (userRecord?.must_change_password) {
    redirect("/change-password");
  }

  const org = userRecord?.organisations as Record<string, string> | null;

  return (
    <WhiteLabelProvider>
      <div className="min-h-screen bg-cr-ivory">
        <Sidebar userRole={userRecord?.role} orgPlan={org?.plan} isWhiteLabel={!!org?.white_label} />
        <TopBar
          orgName={org?.wl_app_name || org?.name}
          orgLogoUrl={org?.wl_logo_url || org?.logo_url}
          userFirstName={userRecord?.first_name}
          userLastName={userRecord?.last_name}
          userAvatarUrl={userRecord?.avatar_url}
        />
        <main className="md:ml-64 pt-14 min-h-screen">
          <div className="p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    </WhiteLabelProvider>
  );
}
