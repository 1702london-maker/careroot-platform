"use client";

import { cn } from "@/lib/utils";

interface CREmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CREmptyState({
  icon,
  title,
  description,
  action,
  className,
}: CREmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="text-cr-slate opacity-40 mb-4">{icon}</div>
      <h3 className="text-lg font-display font-semibold text-cr-charcoal mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm font-body text-cr-slate max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
