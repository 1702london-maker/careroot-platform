"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CRCard } from "./CRCard";

interface CRStatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "warning" | "danger" | "success";
  className?: string;
  onClick?: () => void;
}

export function CRStatCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  variant = "default",
  className,
  onClick,
}: CRStatCardProps) {
  const variantColors = {
    default: "text-cr-charcoal",
    warning: "text-cr-amber",
    danger: "text-cr-red",
    success: "text-cr-sage",
  };

  return (
    <CRCard
      hover={!!onClick}
      onClick={onClick}
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-body font-medium text-cr-slate uppercase tracking-wide">
          {label}
        </p>
        {icon && (
          <span className="text-cr-slate opacity-60">{icon}</span>
        )}
      </div>

      <div className="flex items-end justify-between">
        <span
          className={cn(
            "text-3xl font-display font-semibold",
            variantColors[variant]
          )}
        >
          {value}
        </span>

        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-body font-medium",
              trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-cr-slate"
            )}
          >
            {trend > 0 ? (
              <TrendingUp size={14} />
            ) : trend < 0 ? (
              <TrendingDown size={14} />
            ) : (
              <Minus size={14} />
            )}
            <span>
              {trend > 0 ? "+" : ""}
              {trend}%{trendLabel ? ` ${trendLabel}` : ""}
            </span>
          </div>
        )}
      </div>
    </CRCard>
  );
}
