"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CRCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  noPadding?: boolean;
}

export function CRCard({ className, hover, noPadding, children, ...props }: CRCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-gray-100 rounded-xl shadow-sm",
        noPadding ? "" : "p-6",
        hover && "hover:shadow-md transition-shadow duration-200 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
