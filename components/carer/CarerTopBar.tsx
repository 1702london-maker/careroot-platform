"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/carer": "Home",
  "/carer/rota": "My Rota",
  "/carer/emar": "eMAR",
  "/carer/logs": "Shift Logs",
  "/carer/handover": "Handover",
  "/carer/report": "Reports",
  "/carer/my-documents": "My Documents",
  "/carer/settings": "Settings",
  "/carer/sos": "SOS / Lone Worker",
};

export function CarerTopBar({ today }: { today: string }) {
  const pathname = usePathname();
  const base = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname === key || pathname.startsWith(key + "/"));
  const title = base ? PAGE_TITLES[base] : "Staff Portal";

  return (
    <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
      <div>
        <p className="font-display text-xl font-semibold text-cr-charcoal">{title}</p>
        <p className="text-xs font-body text-cr-slate mt-0.5">{today}</p>
      </div>
    </div>
  );
}
