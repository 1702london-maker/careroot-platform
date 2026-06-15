"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Step components
import { StepPersonalDetails } from "@/components/onboarding/steps/PersonalDetails";
import { StepMedicalInfo } from "@/components/onboarding/steps/MedicalInfo";
import { StepCareNeeds } from "@/components/onboarding/steps/CareNeeds";
import { StepRiskAssessment } from "@/components/onboarding/steps/RiskAssessment";
import { StepNutritionPlan } from "@/components/onboarding/steps/NutritionPlan";
import { StepCarePlanGeneration } from "@/components/onboarding/steps/CarePlanGeneration";

const STEPS = [
  { number: 1, label: "Personal Details" },
  { number: 2, label: "Medical Info" },
  { number: 3, label: "Care Needs" },
  { number: 4, label: "Risk Assessment" },
  { number: 5, label: "Nutrition Plan" },
  { number: 6, label: "Care Plan" },
];

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<Record<string, unknown>>({});

  const updateData = (key: string, data: unknown) => {
    setOnboardingData((prev) => ({ ...prev, [key]: data }));
  };

  const next = () => setStep((s) => Math.min(s + 1, 6));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div>
      <CRPageHeader
        title="Add New Client"
        subtitle="Complete all 6 steps to activate the care plan"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clients", href: "/clients" },
        ]}
      />

      {/* Progress bar */}
      <CRCard className="mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-semibold transition-all",
                    step > s.number
                      ? "bg-cr-forest text-white"
                      : step === s.number
                      ? "bg-cr-forest text-white ring-4 ring-cr-mint"
                      : "bg-gray-100 text-cr-slate"
                  )}
                >
                  {step > s.number ? <Check size={14} /> : s.number}
                </div>
                <span
                  className={cn(
                    "text-xs font-body mt-1 hidden md:block",
                    step === s.number ? "text-cr-forest font-medium" : "text-cr-slate"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all",
                    step > s.number ? "bg-cr-forest" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </CRCard>

      {/* Step content */}
      {step === 1 && (
        <StepPersonalDetails
          onComplete={(data, id) => {
            updateData("personal", data);
            setClientId(id);
            next();
          }}
        />
      )}
      {step === 2 && clientId && (
        <StepMedicalInfo
          clientId={clientId}
          onComplete={(data) => { updateData("medical", data); next(); }}
          onBack={back}
        />
      )}
      {step === 3 && clientId && (
        <StepCareNeeds
          clientId={clientId}
          onComplete={(data) => { updateData("careNeeds", data); next(); }}
          onBack={back}
        />
      )}
      {step === 4 && clientId && (
        <StepRiskAssessment
          clientId={clientId}
          onComplete={(data) => { updateData("risk", data); next(); }}
          onBack={back}
        />
      )}
      {step === 5 && clientId && (
        <StepNutritionPlan
          clientId={clientId}
          onComplete={(data) => { updateData("nutrition", data); next(); }}
          onBack={back}
        />
      )}
      {step === 6 && clientId && (
        <StepCarePlanGeneration
          clientId={clientId}
          onboardingData={onboardingData}
          onComplete={() => router.push(`/clients/${clientId}`)}
          onBack={back}
        />
      )}
    </div>
  );
}
