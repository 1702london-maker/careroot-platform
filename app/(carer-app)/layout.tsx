import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CarerSidebar } from "@/components/carer/CarerSidebar";
import { CarerBottomNav } from "@/components/carer/CarerBottomNav";
import { CarerTopBar } from "@/components/carer/CarerTopBar";
import { CarerMobileHeader } from "@/components/carer/CarerMobileHeader";
import { OfflineFlushProvider } from "@/components/carer/OfflineFlushProvider";
import { PushNotificationRegistrar } from "@/components/carer/PushNotificationRegistrar";

export default async function CarerAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (!userRecord || !["carer", "senior_carer"].includes(userRecord.role)) {
    redirect("/dashboard");
  }

  const fullName = `${userRecord?.first_name ?? ""} ${userRecord?.last_name ?? ""}`.trim();
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/London",
  });

  return (
    <div className="min-h-screen bg-cr-ivory flex">
      {/* Desktop left sidebar */}
      <CarerSidebar fullName={fullName} today={today} />

      {/* Mobile header */}
      <CarerMobileHeader fullName={fullName} today={today} />

      {/* Main content */}
      <main className="md:ml-64 flex-1 pt-16 md:pt-0 pb-20 md:pb-0 min-h-screen">
        {/* Desktop top bar — dynamic per page */}
        <CarerTopBar today={today} />
        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <CarerBottomNav />

      {/* Auto-flush offline queue when connectivity restores */}
      <OfflineFlushProvider />
      <PushNotificationRegistrar />
    </div>
  );
}
