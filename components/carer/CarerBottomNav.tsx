"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, AlertTriangle, Calendar, Pill, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/carer", icon: Home, label: "Home", sos: false },
  { href: "/carer/rota", icon: Calendar, label: "Rota", sos: false },
  { href: "/carer/emar", icon: Pill, label: "eMAR", sos: false },
  { href: "/carer/handover", icon: ArrowRightLeft, label: "Handover", sos: false },
  { href: "/carer/sos", icon: AlertTriangle, label: "SOS", sos: true },
];

export function CarerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40">
      {NAV_ITEMS.map(({ href, icon: Icon, label, sos }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 min-h-[56px] transition-colors",
              sos ? "text-cr-red" : active ? "text-cr-forest" : "text-cr-slate"
            )}
          >
            <Icon size={22} />
            <span className="text-[10px] font-body">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
