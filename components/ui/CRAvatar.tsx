"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface CRAvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const imgSizes = { sm: 28, md: 36, lg: 48, xl: 64 };

export function CRAvatar({ src, firstName, lastName, size = "md", className }: CRAvatarProps) {
  const initials = getInitials(firstName, lastName);
  const px = imgSizes[size];

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center overflow-hidden flex-shrink-0",
        "bg-cr-mint text-cr-forest font-body font-semibold",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={`${firstName} ${lastName}`}
          width={px}
          height={px}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}
