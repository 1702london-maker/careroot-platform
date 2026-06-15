"use client";

import { useState } from "react";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { CRAvatar } from "@/components/ui/CRAvatar";
import { formatTimeUK } from "@/lib/utils";
import { MapPin, Clock, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  visits: Record<string, unknown>[];
  user: Record<string, unknown> | null;
}

export function CarerDashboard({ visits, user }: Props) {
  const completed = visits.filter((v) => v.status === "completed").length;
  const upcoming = visits.filter((v) => v.status === "scheduled");
  const total = visits.length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <CRCard className="!p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-body font-semibold text-cr-charcoal">Today&apos;s Visits</span>
          <span className="text-xl font-bold font-body text-cr-forest">{completed}/{total}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-cr-forest rounded-full transition-all"
            style={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
          />
        </div>
        <p className="text-xs text-cr-slate mt-2">{total - completed} remaining today</p>
      </CRCard>

      {/* Visit list */}
      <div>
        <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-3">Your Schedule</h2>
        {visits.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto mb-2 text-cr-forest" size={40} />
            <p className="font-body text-cr-charcoal font-medium">No visits today</p>
            <p className="text-sm text-cr-slate">Check back tomorrow</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => {
              const client = visit.clients as Record<string, unknown> | null;
              const address = client?.address as Record<string, string> | null;
              const isCompleted = visit.status === "completed";
              const isCurrent = visit.status === "in_progress";

              return (
                <Link key={String(visit.id)} href={`/carer/visit/${visit.id}`}>
                  <CRCard className={cn(
                    "!p-4 transition-all",
                    isCurrent ? "border-cr-forest ring-2 ring-cr-forest" : "",
                    isCompleted ? "opacity-60" : "hover:shadow-md"
                  )}>
                    {Boolean(client?.dnr_status) && (
                      <div className="mb-3 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-body font-bold text-cr-red">⚠️ DNR ORDER IN PLACE</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <CRAvatar
                          src={String(client?.photo_url || "")}
                          name={`${client?.first_name} ${client?.last_name}`}
                          size="md"
                        />
                        {isCompleted && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-body font-semibold text-cr-charcoal truncate">
                            {String(client?.first_name)} {String(client?.last_name)}
                          </p>
                          <CRBadge variant={
                            isCompleted ? "green" : isCurrent ? "forest" : "slate"
                          }>
                            {String(visit.status)}
                          </CRBadge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-cr-slate">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatTimeUK(String(visit.scheduled_start))} — {formatTimeUK(String(visit.scheduled_end))}
                          </span>
                          {address?.line1 && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin size={10} />
                              {address.city || address.line1}
                            </span>
                          )}
                        </div>
                        {client?.risk_level && String(client.risk_level) !== "low" && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle size={10} className="text-amber-500" />
                            <span className="text-xs text-amber-600 capitalize">{String(client.risk_level)} risk</span>
                          </div>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-cr-slate shrink-0" />
                    </div>
                  </CRCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
