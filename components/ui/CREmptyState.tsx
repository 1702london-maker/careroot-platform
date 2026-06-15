"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface CREmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode | { label: string; href: string };
  className?: string;
}

export function CREmptyState({ icon, title, description, action, className }: CREmptyStateProps) {
  const isLinkAction = action && typeof action === "object" && "label" in (action as object);

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <div className="text-cr-slate opacity-40 mb-4">{icon}</div>
      <h3 className="text-lg font-display font-semibold text-cr-charcoal mb-2">{title}</h3>
      {description && (
        <p className="text-sm font-body text-cr-slate max-w-sm mb-6">{description}</p>
      )}
      {isLinkAction ? (
        <Link
          href={(action as { label: string; href: string }).href}
          className="cr-btn-primary px-5 py-2.5 text-sm"
        >
          {(action as { label: string; href: string }).label}
        </Link>
      ) : (
        action && <div>{action as React.ReactNode}</div>
      )}
    </div>
  );
}
