"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CREmergencyButtonProps {
  onClick: () => void;
  fixed?: boolean;
  className?: string;
  label?: string;
}

export function CREmergencyButton({
  onClick,
  fixed = true,
  className,
  label = "EMERGENCY",
}: CREmergencyButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2",
        "bg-cr-red text-white font-body font-bold",
        "rounded-xl min-h-[64px] px-6 py-4",
        "shadow-lg hover:bg-red-700 active:scale-95",
        "transition-all duration-150",
        "text-base tracking-wide uppercase",
        "border-2 border-red-800",
        fixed && "fixed bottom-4 left-4 right-4 z-50",
        className
      )}
      aria-label="Trigger emergency alert"
    >
      <AlertTriangle size={24} strokeWidth={2.5} />
      {label}
    </button>
  );
}
