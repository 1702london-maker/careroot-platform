"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CRAIBadgeProps {
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export function CRAIBadge({ label = "AI-powered", className, size = "md" }: CRAIBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-body font-medium rounded-full border",
        "bg-yellow-50 text-yellow-800 border-yellow-200 border-l-2 border-l-cr-gold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs",
        className
      )}
    >
      <Sparkles size={size === "sm" ? 10 : 12} className="text-cr-gold" />
      {label}
    </span>
  );
}
