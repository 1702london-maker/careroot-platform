"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface CRButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export function CRButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: CRButtonProps) {
  const base = "inline-flex items-center justify-center font-body font-semibold rounded-btn transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-cr-forest text-white hover:bg-cr-sage focus:ring-cr-forest",
    secondary: "bg-white text-cr-charcoal border border-gray-200 hover:bg-gray-50 focus:ring-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "text-cr-charcoal hover:bg-gray-100 focus:ring-gray-300",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1",
    md: "text-sm px-4 py-2 gap-1.5",
    lg: "text-base px-6 py-3 gap-2",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {loading && <Loader2 size={size === "sm" ? 12 : 14} className="animate-spin flex-shrink-0" />}
      {children}
    </button>
  );
}
