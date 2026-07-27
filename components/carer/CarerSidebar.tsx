"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Home, Calendar, Pill, ArrowRightLeft, AlertTriangle,
  FileText, Settings, LogOut, Leaf, ChevronRight, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/carer", icon: Home, label: "Home", exact: true },
  { href: "/carer/rota", icon: Calendar, label: "My Rota" },
  { href: "/carer/emar", icon: Pill, label: "eMAR" },
  { href: "/carer/logs", icon: ClipboardList, label: "Shift Logs" },
  { href: "/carer/handover", icon: ArrowRightLeft, label: "Handover" },
  { href: "/carer/report", icon: FileText, label: "Reports" },
  { href: "/carer/my-documents", icon: FileText, label: "My Documents" },
  { href: "/carer/settings", icon: Settings, label: "Settings" },
];

const SOS_ITEM = { href: "/carer/sos", icon: AlertTriangle, label: "SOS / Lone Worker" };

interface Props {
  fullName: string;
  today: string;
}

export function CarerSidebar({ fullName, today }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-cr-forest text-white h-screen fixed left-0 top-0 z-40 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
          <Leaf size={18} className="text-cr-forest" />
        </div>
        <span className="font-display text-xl font-semibold text-white">Careroot</span>
      </div>

      {/* Staff identity */}
      <div className="px-6 py-4 border-b border-white/10">
        <p className="text-[10px] font-body font-semibold text-white/40 uppercase tracking-widest mb-1">Staff Portal</p>
        <p className="font-display text-base font-semibold text-white leading-snug">{fullName}</p>
        <p className="text-xs font-body text-white/50 mt-0.5">{today}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-3 mb-2 text-xs font-body font-medium text-white/40 uppercase tracking-widest">Navigation</p>
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body font-medium transition-all duration-150 mb-0.5",
                isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          );
        })}

        {/* SOS — separate group */}
        <div className="mt-4">
          <p className="px-3 mb-2 text-xs font-body font-medium text-white/40 uppercase tracking-widest">Safety</p>
          <Link
            href={SOS_ITEM.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body font-medium transition-all duration-150",
              pathname === SOS_ITEM.href
                ? "bg-red-600/80 text-white"
                : "text-red-300 hover:bg-red-600/40 hover:text-white"
            )}
          >
            <SOS_ITEM.icon size={18} className="flex-shrink-0" />
            <span className="flex-1">{SOS_ITEM.label}</span>
            {pathname === SOS_ITEM.href && <ChevronRight size={14} className="opacity-60" />}
          </Link>
        </div>
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
