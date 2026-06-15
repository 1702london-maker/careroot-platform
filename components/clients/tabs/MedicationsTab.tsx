"use client";

import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { Pill } from "lucide-react";

interface Props {
  client: Record<string, unknown>;
  medications: Record<string, unknown>[];
}

export function ClientMedicationsTab({ client, medications }: Props) {
  const allergies = (client.allergies as Array<Record<string, string>>) || [];

  if (medications.length === 0 && allergies.length === 0) {
    return (
      <CREmptyState
        icon={<Pill className="text-cr-slate" size={40} />}
        title="No medications recorded"
        description="Medications can be added during onboarding or from this tab"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Allergies */}
      {allergies.length > 0 && (
        <CRCard>
          <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Known Allergies</h3>
          <div className="space-y-2">
            {allergies.map((allergy, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
                <div>
                  <p className="text-sm font-body font-semibold text-cr-charcoal">{allergy.name}</p>
                  {allergy.description && <p className="text-xs text-cr-slate">{allergy.description}</p>}
                </div>
                <CRBadge variant={allergy.severity === "anaphylactic" || allergy.severity === "severe" ? "red" : allergy.severity === "moderate" ? "amber" : "green"}>
                  {allergy.severity}
                </CRBadge>
              </div>
            ))}
          </div>
        </CRCard>
      )}

      {/* Medications */}
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Active Medications</h3>
        {medications.length === 0 ? (
          <p className="text-sm text-cr-slate">No medications recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Medication", "Dosage", "Frequency", "Route", "Prescriber"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-medium text-cr-slate uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medications.map((med) => (
                  <tr key={String(med.id)} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-cr-charcoal">{String(med.name)}</td>
                    <td className="py-3 px-3 text-cr-slate">{String(med.dosage || "—")}</td>
                    <td className="py-3 px-3 text-cr-slate">{String(med.frequency || "—")}</td>
                    <td className="py-3 px-3 text-cr-slate capitalize">{String(med.route || "—")}</td>
                    <td className="py-3 px-3 text-cr-slate">{String(med.prescriber || "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CRCard>
    </div>
  );
}
