"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ClientOverviewTab } from "./tabs/OverviewTab";
import { ClientCarePlanTab } from "./tabs/CarePlanTab";
import { ClientMedicationsTab } from "./tabs/MedicationsTab";
import { ClientNotesTab } from "./tabs/NotesTab";
import { ClientIncidentsTab } from "./tabs/IncidentsTab";
import { ClientRiskTab } from "./tabs/RiskTab";
import { ClientNutritionTab } from "./tabs/NutritionTab";
import { ClientEmergencyTab } from "./tabs/EmergencyTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "careplan", label: "Care Plan" },
  { id: "medications", label: "Medications" },
  { id: "notes", label: "Visit Notes" },
  { id: "incidents", label: "Incidents" },
  { id: "risk", label: "Risk" },
  { id: "nutrition", label: "Nutrition" },
  { id: "emergency", label: "Emergency" },
];

interface Props {
  client: Record<string, unknown>;
  carePlans: Record<string, unknown>[];
  medications: Record<string, unknown>[];
  recentVisits: Record<string, unknown>[];
  incidents: Record<string, unknown>[];
  riskAssessment: Record<string, unknown> | null;
  nutritionProfile: Record<string, unknown> | null;
  emergencyToken: string | null;
  familyAccess: Record<string, unknown>[];
}

export function ClientTabs({
  client, carePlans, medications, recentVisits, incidents,
  riskAssessment, nutritionProfile, emergencyToken, familyAccess,
}: Props) {
  const [active, setActive] = useState("overview");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-200 mb-6 gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-body font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
              active === tab.id
                ? "border-cr-forest text-cr-forest"
                : "border-transparent text-cr-slate hover:text-cr-charcoal"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "overview" && <ClientOverviewTab client={client} recentVisits={recentVisits} familyAccess={familyAccess} />}
      {active === "careplan" && <ClientCarePlanTab client={client} carePlans={carePlans} />}
      {active === "medications" && <ClientMedicationsTab client={client} medications={medications} />}
      {active === "notes" && <ClientNotesTab client={client} visits={recentVisits} />}
      {active === "incidents" && <ClientIncidentsTab client={client} incidents={incidents} />}
      {active === "risk" && <ClientRiskTab client={client} riskAssessment={riskAssessment} />}
      {active === "nutrition" && <ClientNutritionTab client={client} nutritionProfile={nutritionProfile} />}
      {active === "emergency" && <ClientEmergencyTab client={client} emergencyToken={emergencyToken} />}
    </div>
  );
}
