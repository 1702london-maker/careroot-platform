"use client";

import { cn } from "@/lib/utils";

interface Step {
  step: number;
  instruction: string;
}

interface CRStepListProps {
  steps: Step[];
  className?: string;
  large?: boolean;
}

export function CRStepList({ steps, className, large = false }: CRStepListProps) {
  if (!steps || steps.length === 0) {
    return (
      <p className="text-sm font-body text-cr-slate italic">No steps added yet.</p>
    );
  }

  return (
    <ol className={cn("space-y-3", className)}>
      {steps.map((s) => (
        <li key={s.step} className="flex items-start gap-3">
          <span
            className={cn(
              "flex-shrink-0 rounded-full bg-cr-forest text-white font-body font-semibold",
              "flex items-center justify-center",
              large ? "w-8 h-8 text-sm mt-0.5" : "w-6 h-6 text-xs mt-0.5"
            )}
          >
            {s.step}
          </span>
          <p
            className={cn(
              "font-body text-cr-charcoal leading-relaxed",
              large ? "text-base" : "text-sm"
            )}
          >
            {s.instruction}
          </p>
        </li>
      ))}
    </ol>
  );
}
