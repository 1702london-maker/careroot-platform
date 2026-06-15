"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Calendar, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/carer", icon: Home, label: "Home" },
  { href: "/carer/clients", icon: Users, label: "Clients" },
  { href: "/carer/schedule", icon: Calendar, label: "Schedule" },
  { href: "/carer/notes", icon: FileText, label: "Notes" },
  { href: "/carer/settings", icon: Settings, label: "Settings" },
];

export function CarerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 min-h-[56px] transition-colors",
              active ? "text-cr-forest" : "text-cr-slate"
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
