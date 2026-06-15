import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";

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

  const org = userRecord?.organisations as Record<string, string> | null;

  return (
    <div className="min-h-screen bg-cr-ivory">
      <Sidebar />
      <TopBar
        orgName={org?.name}
        orgLogoUrl={org?.logo_url}
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
  );
}
