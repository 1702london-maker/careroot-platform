"use client";

import { MapPin } from "lucide-react";

type Props = {
  compact?: boolean;
};

export function LocationSafetyNotice({ compact = false }: Props) {
  return (
    <div className={`rounded-2xl border border-blue-200 bg-blue-50 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start gap-2.5">
        <MapPin size={compact ? 15 : 18} className="mt-0.5 flex-shrink-0 text-blue-700" />
        <div>
          <p className="text-xs font-bold text-blue-900">Location safety check</p>
          <p className={`${compact ? "text-[11px]" : "text-xs"} mt-1 leading-relaxed text-blue-800`}>
            Keep location switched on while using Careroot. It confirms you are with the client before care notes,
            medication, incidents, handovers, and shift actions can be saved. If location is off, blocked, or outside
            the approved client radius, the app will stop care logging and your manager may follow up for safety training.
          </p>
        </div>
      </div>
    </div>
  );
}
