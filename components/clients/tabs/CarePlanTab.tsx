"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { formatDateUK } from "@/lib/utils";
import { FileText, CheckCircle, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

interface Props {
  client: Record<string, unknown>;
  carePlans: Record<string, unknown>[];
}

export function ClientCarePlanTab({ client, carePlans }: Props) {
  const [approving, setApproving] = useState<string | null>(null);
  const supabase = createClient();

  const activePlan = carePlans.find((p) => p.status === "active");
  const draftPlans = carePlans.filter((p) => p.status === "draft");

  const approvePlan = async (planId: string) => {
    setApproving(planId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("care_plans").update({
        status: "active",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      }).eq("id", planId);

      // Archive previous active plan
      if (activePlan) {
        await supabase.from("care_plans").update({ status: "archived" }).eq("id", activePlan.id);
      }

      window.location.reload();
    } finally {
      setApproving(null);
    }
  };

  if (carePlans.length === 0) {
    return (
      <CREmptyState
        icon={<FileText className="text-cr-slate" size={40} />}
        title="No care plan yet"
        description="Complete the client onboarding to generate an AI care plan"
        action={{ label: "Complete onboarding", href: `/clients/new` }}
      />
    );
  }

  const PlanCard = ({ plan }: { plan: Record<string, unknown> }) => {
    const sections = plan.sections as Record<string, string> | null;
    return (
      <CRCard className="mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-xl font-semibold text-cr-charcoal">{String(plan.title)}</h3>
              {plan.ai_generated && <CRAIBadge />}
            </div>
            <p className="text-xs font-body text-cr-slate">
              Version {String(plan.version)} · Created {formatDateUK(String(plan.created_at))}
              {plan.approved_at && ` · Approved ${formatDateUK(String(plan.approved_at))}`}
            </p>
          </div>
          <CRBadge variant={plan.status === "active" ? "green" : plan.status === "draft" ? "amber" : "slate"}>
            {String(plan.status)}
          </CRBadge>
        </div>

        {plan.status === "draft" && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-600" />
              <p className="text-sm font-body text-amber-800">Awaiting manager approval — carers cannot see this plan</p>
            </div>
            <button
              onClick={() => approvePlan(String(plan.id))}
              disabled={approving === String(plan.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cr-forest text-white rounded-lg text-sm font-body hover:bg-cr-sage"
            >
              {approving === String(plan.id) ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Approve
            </button>
          </div>
        )}

        {sections && (
          <div className="space-y-4">
            {Object.entries(sections).slice(0, plan.status === "active" ? 10 : 3).map(([key, value]) => (
              <div key={key}>
                <h4 className="text-sm font-body font-semibold text-cr-charcoal mb-1 capitalize">
                  {key.replace(/_/g, " ")}
                </h4>
                <p className="text-sm font-body text-cr-charcoal leading-relaxed">{value}</p>
              </div>
            ))}
            {plan.status === "draft" && sections && Object.keys(sections).length > 3 && (
              <p className="text-sm text-cr-slate italic">+ {Object.keys(sections).length - 3} more sections (visible after approval)</p>
            )}
          </div>
        )}
      </CRCard>
    );
  };

  return (
    <div>
      {activePlan && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-green-600" />
            <h2 className="font-display text-xl font-semibold text-cr-charcoal">Active Care Plan</h2>
          </div>
          <PlanCard plan={activePlan} />
        </div>
      )}

      {draftPlans.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-semibold text-cr-charcoal mb-3">Draft Plans Awaiting Approval</h2>
          {draftPlans.map((plan) => (
            <PlanCard key={String(plan.id)} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
