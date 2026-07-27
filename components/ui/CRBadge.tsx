"use client";

import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/lib/badge-variants";

interface CRBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

const variantClasses: Record<BadgeVariant, string> = {
  green: "bg-green-100 text-green-800 border-green-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  red: "bg-red-100 text-red-800 border-red-200",
  slate: "bg-gray-100 text-gray-700 border-gray-200",
  gold: "bg-yellow-50 text-yellow-800 border-yellow-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  forest: "bg-cr-mint text-cr-forest border-cr-sage/30",
};

export function CRBadge({ variant = "slate", children, className, size = "md" }: CRBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-body font-medium rounded-full border",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
