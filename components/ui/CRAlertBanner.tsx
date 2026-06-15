"use client";

import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type BannerVariant = "red" | "amber" | "green" | "blue";

interface CRAlertBannerProps {
  variant?: BannerVariant;
  title: string;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantConfig: Record<
  BannerVariant,
  { bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  red: {
    bg: "bg-red-50",
    border: "border-cr-red",
    text: "text-cr-red",
    icon: <XCircle size={18} strokeWidth={2.5} />,
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-cr-amber",
    text: "text-amber-800",
    icon: <AlertTriangle size={18} strokeWidth={2.5} />,
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-500",
    text: "text-green-800",
    icon: <CheckCircle size={18} strokeWidth={2.5} />,
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-500",
    text: "text-blue-800",
    icon: <Info size={18} strokeWidth={2.5} />,
  },
};

export function CRAlertBanner({
  variant = "red",
  title,
  description,
  className,
  icon,
  fullWidth = true,
}: CRAlertBannerProps) {
  const config = variantConfig[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border-l-4",
        config.bg,
        config.border,
        fullWidth && "w-full",
        className
      )}
    >
      <span className={cn("flex-shrink-0 mt-0.5", config.text)}>
        {icon || config.icon}
      </span>
      <div>
        <p className={cn("font-body font-semibold text-sm", config.text)}>
          {title}
        </p>
        {description && (
          <p className={cn("font-body text-xs mt-0.5 opacity-80", config.text)}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
