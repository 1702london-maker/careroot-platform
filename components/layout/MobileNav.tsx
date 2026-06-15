"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Clock, Shield, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNav = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={22} /> },
  { label: "Clients", href: "/clients", icon: <Users size={22} /> },
  { label: "Visits", href: "/visits", icon: <Clock size={22} /> },
  { label: "Compliance", href: "/compliance", icon: <Shield size={22} /> },
  { label: "Settings", href: "/settings/organisation", icon: <Settings size={22} /> },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 pb-safe">
      <div className="flex items-center">
        {mobileNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[48px]",
                "text-xs font-body font-medium transition-colors",
                isActive ? "text-cr-forest" : "text-cr-slate"
              )}
            >
              <span className={cn(isActive && "text-cr-forest")}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
