"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Calendar, Clock,
  UserCheck, Heart, Sparkles, TrendingUp, BookOpen,
  Shield, FileCheck, FolderOpen, MessageSquare,
  AlertTriangle, BarChart3, Settings, LogOut,
  ChevronRight, Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CRAIBadge } from "@/components/ui/CRAIBadge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  aiPowered?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    title: "Care",
    items: [
      { label: "Clients", href: "/clients", icon: <Users size={18} /> },
      { label: "Visits", href: "/visits", icon: <Clock size={18} /> },
      { label: "Rota", href: "/rota", icon: <Calendar size={18} /> },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Staff", href: "/staff", icon: <UserCheck size={18} /> },
      { label: "Family", href: "/settings/users", icon: <Heart size={18} /> },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        label: "AI Risk Flags",
        href: "/ai/risk-flags",
        icon: <Sparkles size={18} />,
        aiPowered: true,
      },
      {
        label: "Insights",
        href: "/ai/insights",
        icon: <TrendingUp size={18} />,
        aiPowered: true,
      },
      {
        label: "Family Briefs",
        href: "/ai/family-briefs",
        icon: <BookOpen size={18} />,
        aiPowered: true,
      },
    ],
  },
  {
    title: "Compliance",
    items: [
      { label: "CQC", href: "/compliance/cqc", icon: <Shield size={18} /> },
      { label: "Ofsted", href: "/compliance/ofsted", icon: <FileCheck size={18} /> },
      { label: "Evidence", href: "/compliance/evidence", icon: <FolderOpen size={18} /> },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Complaints", href: "/complaints", icon: <MessageSquare size={18} /> },
      { label: "Emergency Log", href: "/emergency", icon: <AlertTriangle size={18} /> },
      { label: "Reports", href: "/reports", icon: <BarChart3 size={18} /> },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-cr-forest text-white h-screen fixed left-0 top-0 z-40 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <Leaf size={18} className="text-cr-forest" />
        </div>
        <span className="font-display text-xl font-semibold text-white">Careroot</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="px-3 mb-1 text-xs font-body font-medium text-white/40 uppercase tracking-widest">
              {group.title}
            </p>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body font-medium transition-all duration-150",
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.aiPowered && <CRAIBadge size="sm" label="AI" />}
                  {isActive && <ChevronRight size={14} className="opacity-60" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
        <Link
          href="/settings/organisation"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <Settings size={18} />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
