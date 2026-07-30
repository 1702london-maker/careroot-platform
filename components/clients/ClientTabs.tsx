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
import { ClientAITab } from "./tabs/AITab";
import { ClientDocumentsTab } from "./tabs/DocumentsTab";
import { ClientFamilyTab } from "./tabs/FamilyTab";
import { ClientBodyMapTab } from "./tabs/BodyMapTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "careplan", label: "Care Plan" },
  { id: "medications", label: "Medications" },
  { id: "notes", label: "Visit Notes" },
  { id: "incidents", label: "Incidents" },
  { id: "risk", label: "Risk" },
  { id: "nutrition", label: "Nutrition" },
  { id: "bodymap", label: "Body Map" },
  { id: "documents", label: "Documents" },
  { id: "family", label: "Family" },
  { id: "emergency", label: "Emergency" },
  { id: "ai", label: "✦ Analysis" },
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
  emergencyPin: string | null;
  canManageEmergencyAccess?: boolean;
  familyAccess: Record<string, unknown>[];
  clientDocuments: Record<string, unknown>[];
}

export function ClientTabs({
  client, carePlans, medications, recentVisits, incidents,
  riskAssessment, nutritionProfile, emergencyToken, emergencyPin, canManageEmergencyAccess = false, familyAccess, clientDocuments,
}: Props) {
  const [active, setActive] = useState("overview");
  const tabs = canManageEmergencyAccess ? TABS : TABS.filter((tab) => tab.id !== "emergency");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-200 mb-6 gap-0">
        {tabs.map((tab) => (
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
      {active === "bodymap" && <ClientBodyMapTab client={client} bodyMapInjuries={(client.bodyMapInjuries ?? []) as Record<string, unknown>[]} />}
      {active === "documents" && <ClientDocumentsTab client={client} initialDocs={clientDocuments as never} />}
      {active === "family" && <ClientFamilyTab client={client} familyAccess={familyAccess as never} />}
      {active === "emergency" && canManageEmergencyAccess && <ClientEmergencyTab client={client} emergencyToken={emergencyToken} emergencyPin={emergencyPin} />}
      {active === "ai" && <ClientAITab client={client} />}
    </div>
  );
}
