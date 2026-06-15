import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CarerBottomNav } from "@/components/carer/CarerBottomNav";

export default async function CarerAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase.from("users")
    .select("role, first_name, last_name").eq("id", user.id).single();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Carer header */}
      <div className="bg-cr-forest text-white px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-body opacity-70">Careroot</p>
          <p className="font-body font-semibold">{userRecord?.first_name} {userRecord?.last_name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-70">Today</p>
          <p className="font-body text-sm font-semibold">
            {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </p>
        </div>
      </div>

      <main className="px-4 pt-4">{children}</main>
      <CarerBottomNav />
    </div>
  );
}
