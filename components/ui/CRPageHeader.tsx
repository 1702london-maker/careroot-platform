"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface CRPageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function CRPageHeader({
  title,
  breadcrumbs,
  action,
  subtitle,
  className,
}: CRPageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-6", className)}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 mb-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={12} className="text-cr-slate" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-xs font-body text-cr-slate hover:text-cr-forest transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-xs font-body text-cr-slate">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-cr-charcoal">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm font-body text-cr-slate mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}
