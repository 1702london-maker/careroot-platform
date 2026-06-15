"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { Loader2, CheckCircle, QrCode, Printer, Sparkles } from "lucide-react";

interface CarePlanSection {
  title: string;
  content: string;
}

interface Props {
  clientId: string;
  onboardingData: Record<string, unknown>;
  onComplete: () => void;
  onBack: () => void;
}

export function StepCarePlanGeneration({ clientId, onboardingData, onComplete, onBack }: Props) {
  const supabase = createClient();
  const [generating, setGenerating] = useState(false);
  const [carePlanSections, setCarePlanSections] = useState<CarePlanSection[] | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [emergencyToken, setEmergencyToken] = useState<string | null>(null);
  const [emergencyPin, setEmergencyPin] = useState<string | null>(null);
  const [client, setClient] = useState<{ first_name: string; last_name: string } | null>(null);

  useEffect(() => {
    supabase.from("clients").select("first_name, last_name").eq("id", clientId).single()
      .then(({ data }) => setClient(data));
  }, [clientId]);

  const generateCarePlan = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai/care-plan-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, ...onboardingData }),
      });

      if (!res.ok) throw new Error("AI generation failed");
      const data = await res.json();

      const sections: CarePlanSection[] = Object.entries(data.sections || {}).map(([key, val]) => ({
        title: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        content: String(val),
      }));

      setCarePlanSections(sections);
    } catch {
      setError("Failed to generate care plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const saveAndActivate = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userRecord } = await supabase.from("users")
        .select("organisation_id, id, role").eq("id", user!.id).single();

      const status = userRecord?.role === "carer" ? "draft" : "draft";

      const { data: carePlan } = await supabase.from("care_plans").insert({
        client_id: clientId,
        organisation_id: userRecord?.organisation_id,
        created_by: userRecord?.id,
        title: `Care Plan — ${client?.first_name} ${client?.last_name}`,
        sections: carePlanSections?.reduce((acc, s) => ({
          ...acc,
          [s.title.toLowerCase().replace(/ /g, "_")]: s.content,
        }), {}),
        ai_generated: true,
        status,
        version: 1,
      }).select().single();

      // Generate emergency access token + PIN
      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      const pinHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin))
        .then((b) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join(""));

      await supabase.from("emergency_access_tokens").insert({
        client_id: clientId,
        organisation_id: userRecord?.organisation_id,
        token,
        pin_hash: pinHash,
        is_active: true,
      });

      await supabase.from("clients").update({ onboarding_complete: true, onboarding_step: 6 }).eq("id", clientId);

      setEmergencyToken(token);
      setEmergencyPin(pin);
      setSaved(true);
    } catch {
      setError("Failed to save care plan");
    } finally {
      setSaving(false);
    }
  };

  const printEmergencyCard = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Emergency Card — ${client?.first_name} ${client?.last_name}</title>
      <style>body{font-family:sans-serif;padding:20px;max-width:400px}
      .header{background:#1A3C2E;color:white;padding:16px;border-radius:8px;margin-bottom:16px}
      .pin{font-size:36px;font-weight:bold;letter-spacing:8px;color:#DC2626;text-align:center;margin:16px 0}
      .url{font-size:12px;word-break:break-all;color:#6B7280}
      p{margin:4px 0;font-size:14px}</style></head>
      <body>
        <div class="header"><h2 style="margin:0">Emergency Medical Access</h2>
        <p style="margin:4px 0;font-size:14px;opacity:0.8">${client?.first_name} ${client?.last_name}</p></div>
        <p><strong>Scan QR or visit:</strong></p>
        <p class="url">careroot.care/emergency/${emergencyToken}</p>
        <p class="pin">${emergencyPin}</p>
        <p style="text-align:center;color:#6B7280;font-size:12px">6-digit PIN to access medical information</p>
        <p style="margin-top:16px;font-size:12px;color:#6B7280">For emergency paramedic use only. Contact agency: [PHONE]</p>
      </body></html>
    `);
    win.print();
  };

  if (saved && emergencyToken) {
    return (
      <CRCard>
        <div className="text-center py-8">
          <CheckCircle className="mx-auto mb-4 text-cr-forest" size={48} />
          <h2 className="font-display text-2xl font-semibold text-cr-charcoal mb-2">
            {client?.first_name} {client?.last_name} is ready
          </h2>
          <p className="text-sm font-body text-cr-slate mb-8">
            Care plan saved as draft — a manager will review and approve before carers can access it.
          </p>

          <CRAlertBanner
            variant="amber"
            title="Awaiting Manager Approval"
            description="Carers cannot see the care plan until a manager or coordinator approves it. You'll receive a notification once approved."
            className="text-left mb-6"
          />

          <div className="bg-cr-mint rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="text-cr-forest" size={20} />
              <span className="font-body font-semibold text-cr-charcoal">Emergency Paramedic Access</span>
            </div>
            <p className="text-sm font-body text-cr-slate mb-3">
              This PIN card gives paramedics instant access to critical medical information in an emergency.
            </p>
            <div className="text-4xl font-bold tracking-widest text-cr-red text-center my-4">{emergencyPin}</div>
            <p className="text-xs text-cr-slate text-center mb-4">
              careroot.care/emergency/{emergencyToken}
            </p>
            <button
              onClick={printEmergencyCard}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cr-forest text-white rounded-lg text-sm font-body hover:bg-cr-sage transition-colors"
            >
              <Printer size={16} /> Print Emergency Card
            </button>
          </div>

          <button onClick={onComplete} className="cr-btn-primary px-8 py-3 w-full">
            Go to Client Profile →
          </button>
        </div>
      </CRCard>
    );
  }

  return (
    <div className="space-y-6">
      <CRCard>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display text-xl font-semibold text-cr-charcoal">AI Care Plan Generation</h2>
          <CRAIBadge />
        </div>
        <p className="text-sm font-body text-cr-slate mb-6">
          Claude AI will analyse all information you&apos;ve provided and draft a comprehensive care plan. A manager must approve it before carers can see it.
        </p>

        {!carePlanSections && (
          <button
            onClick={generateCarePlan}
            disabled={generating}
            className="cr-btn-primary flex items-center gap-2 px-6 py-3 w-full justify-center"
          >
            {generating ? (
              <><Loader2 size={18} className="animate-spin" /> Generating care plan with AI...</>
            ) : (
              <><Sparkles size={18} /> Generate Care Plan with AI</>
            )}
          </button>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 mt-4">
            <p className="text-xs text-cr-red">{error}</p>
          </div>
        )}
      </CRCard>

      {carePlanSections && (
        <>
          <div className="space-y-4">
            {carePlanSections.map((section) => (
              <CRCard key={section.title}>
                <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-2">{section.title}</h3>
                <p className="text-sm font-body text-cr-charcoal leading-relaxed whitespace-pre-wrap">{section.content}</p>
              </CRCard>
            ))}
          </div>

          <CRAlertBanner
            variant="blue"
            title="Review before saving"
            description="Review each section above. You can edit them after saving. The care plan will be sent to a manager for approval."
          />

          <div className="flex justify-between">
            <button type="button" onClick={() => setCarePlanSections(null)} className="cr-btn-secondary px-6 py-3 text-sm">
              Regenerate
            </button>
            <button
              onClick={saveAndActivate}
              disabled={saving}
              className="cr-btn-primary flex items-center gap-2 px-6 py-3"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Saving..." : "Save Care Plan & Complete Onboarding"}
            </button>
          </div>
        </>
      )}

      {!carePlanSections && (
        <div className="flex justify-between">
          <button type="button" onClick={onBack} className="cr-btn-secondary px-6 py-3 text-sm">← Back</button>
        </div>
      )}
    </div>
  );
}
