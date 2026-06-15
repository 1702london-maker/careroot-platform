"use client";

import { Bell, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { CRAvatar } from "@/components/ui/CRAvatar";
import { cn } from "@/lib/utils";

interface TopBarProps {
  orgName?: string;
  orgLogoUrl?: string;
  userFirstName?: string;
  userLastName?: string;
  userAvatarUrl?: string;
  unreadNotifications?: number;
}

export function TopBar({
  orgName,
  orgLogoUrl: _orgLogoUrl,
  userFirstName,
  userLastName,
  userAvatarUrl,
  unreadNotifications = 0,
}: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 z-30 h-14 bg-white border-b border-gray-100 flex items-center px-4 md:px-6 gap-4">
      {/* Org name on mobile */}
      <div className="flex-1 md:flex-none">
        <span className="text-sm font-body font-semibold text-cr-forest truncate">
          {orgName || "Careroot"}
        </span>
      </div>

      <div className="flex-1 hidden md:block" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Emergency quick access */}
        <Link
          href="/emergency"
          className={cn(
            "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
            "bg-red-50 text-cr-red border border-red-200",
            "text-xs font-body font-semibold hover:bg-red-100 transition-colors"
          )}
        >
          <AlertTriangle size={14} strokeWidth={2.5} />
          Emergency
        </Link>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Bell size={18} className="text-cr-slate" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-cr-red rounded-full flex items-center justify-center text-white text-xs font-bold">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </button>

        {/* User avatar */}
        <Link href="/settings/organisation" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <CRAvatar
            src={userAvatarUrl}
            firstName={userFirstName}
            lastName={userLastName}
            size="sm"
          />
          <span className="hidden md:block text-sm font-body font-medium text-cr-charcoal">
            {userFirstName}
          </span>
        </Link>
      </div>
    </header>
  );
}
