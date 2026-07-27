import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CarerSidebar } from "@/components/carer/CarerSidebar";
import { CarerBottomNav } from "@/components/carer/CarerBottomNav";

export default async function CarerAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single();

  const fullName = `${userRecord?.first_name ?? ""} ${userRecord?.last_name ?? ""}`.trim();
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-cr-ivory flex">
      {/* Desktop left sidebar */}
      <CarerSidebar fullName={fullName} today={today} />

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-cr-forest text-white flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <p className="text-[10px] font-body text-white/50 uppercase tracking-widest">Staff Portal</p>
          <p className="font-display font-semibold text-base leading-tight">{fullName}</p>
        </div>
        <p className="text-xs font-body text-white/60">{today}</p>
      </header>

      {/* Main content */}
      <main className="md:ml-64 flex-1 pt-16 md:pt-0 pb-20 md:pb-0 min-h-screen">
        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
          <div>
            <p className="font-display text-xl font-semibold text-cr-charcoal">Staff Dashboard</p>
            <p className="text-xs font-body text-cr-slate mt-0.5">{today}</p>
          </div>
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <CarerBottomNav />
    </div>
  );
}
