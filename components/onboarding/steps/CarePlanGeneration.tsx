"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CRCard } from "@/components/ui/CRCard";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { Loader2, CheckCircle, QrCode, Printer, Sparkles } from "lucide-react";
import QRCode from "qrcode";

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

const supabase = createClient();

export function StepCarePlanGeneration({ clientId, onboardingData, onComplete, onBack }: Props) {
  const [generating, setGenerating] = useState(false);
  const [carePlanSections, setCarePlanSections] = useState<CarePlanSection[] | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [emergencyToken, setEmergencyToken] = useState<string | null>(null);
  const [emergencyPin, setEmergencyPin] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
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

      await supabase.from("care_plans").insert({
        client_id: clientId,
        organisation_id: userRecord?.organisation_id,
        created_by: userRecord?.id,
        title: `Care Plan — ${client?.first_name} ${client?.last_name}`,
        content: carePlanSections?.reduce((acc: Record<string, string>, s) => ({
          ...acc,
          [s.title.toLowerCase().replace(/ /g, "_")]: s.content,
        }), {}),
        status: "draft",
        version: 1,
      }).select().single();

      // Generate emergency access token + 6-digit PIN
      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
      const pin = String(Math.floor(100000 + Math.random() * 900000));

      // Generate QR code data URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care";
      const emergencyUrl = `${appUrl}/emergency/${token}`;
      const qr = await QRCode.toDataURL(emergencyUrl, { width: 200, margin: 1, color: { dark: "#1A3C2E" } });

      await supabase.from("emergency_access_tokens").insert({
        client_id: clientId,
        organisation_id: userRecord?.organisation_id,
        token,
        pin,
        qr_code_url: qr,
      });

      await supabase.from("clients").update({ onboarding_complete: true, onboarding_step: 6 }).eq("id", clientId);

      setEmergencyToken(token);
      setEmergencyPin(pin);
      setQrDataUrl(qr);
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
      <style>
        @page{size:A5;margin:12mm}
        body{font-family:'Helvetica Neue',sans-serif;padding:0;margin:0;background:#fff}
        .card{border:3px solid #1A3C2E;border-radius:12px;overflow:hidden;max-width:148mm}
        .header{background:#1A3C2E;color:white;padding:16px 20px;display:flex;align-items:center;gap:12px}
        .header-text h1{margin:0;font-size:18px;font-weight:700}
        .header-text p{margin:4px 0 0;font-size:13px;opacity:0.8}
        .body{padding:16px 20px}
        .alert{background:#FEF2F2;border:2px solid #DC2626;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:13px;font-weight:600;color:#DC2626;text-align:center}
        .qr-pin{display:flex;align-items:center;gap:16px;margin-bottom:14px}
        .pin{font-size:40px;font-weight:800;letter-spacing:6px;color:#DC2626;font-family:monospace}
        .pin-label{font-size:11px;color:#6B7280;text-align:center;margin-top:4px}
        .url{font-size:10px;word-break:break-all;color:#4A7C5E;margin-top:6px}
        .footer{font-size:10px;color:#9CA3AF;border-top:1px solid #e5e7eb;padding:10px 20px;text-align:center}
        img{display:block}
      </style></head>
      <body>
        <div class="card">
          <div class="header">
            <div class="header-text">
              <h1>Emergency Medical Access</h1>
              <p>${client?.first_name} ${client?.last_name} · Careroot</p>
            </div>
          </div>
          <div class="body">
            <div class="alert">⚠️ For paramedic and emergency service use only</div>
            <div class="qr-pin">
              ${qrDataUrl ? `<img src="${qrDataUrl}" width="120" height="120" alt="QR code" />` : ""}
              <div>
                <p style="font-size:12px;color:#374151;margin:0 0 6px">Scan QR or enter PIN at:</p>
                <div class="pin">${emergencyPin}</div>
                <div class="pin-label">6-digit access PIN</div>
                <div class="url">careroot.care/emergency/${emergencyToken}</div>
              </div>
            </div>
          </div>
          <div class="footer">Contains critical medical information · Do not discard · Careroot © ${new Date().getFullYear()}</div>
        </div>
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
            <p className="text-sm font-body text-cr-slate mb-4">
              Print this card and keep it on the fridge. Paramedics can scan the QR or enter the PIN to access critical medical information immediately.
            </p>
            {qrDataUrl && (
              <div className="flex justify-center mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Emergency QR code" width={160} height={160} className="rounded-lg border-4 border-white shadow-sm" />
              </div>
            )}
            <div className="text-4xl font-bold tracking-widest text-cr-red text-center my-4">{emergencyPin}</div>
            <p className="text-xs text-cr-slate text-center mb-4">
              careroot.care/emergency/{emergencyToken}
            </p>
            <button
              onClick={printEmergencyCard}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cr-forest text-white rounded-lg text-sm font-body hover:bg-cr-sage transition-colors"
            >
              <Printer size={16} /> Print A5 Emergency Card
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
          <h2 className="font-display text-xl font-semibold text-cr-charcoal">Care Plan Generation</h2>
          <CRAIBadge />
        </div>
        <p className="text-sm font-body text-cr-slate mb-6">
          Careroot will analyse all information you&apos;ve provided and draft a comprehensive care plan. A manager must approve it before carers can see it.
        </p>

        {!carePlanSections && (
          <button
            onClick={generateCarePlan}
            disabled={generating}
            className="cr-btn-primary flex items-center gap-2 px-6 py-3 w-full justify-center"
          >
            {generating ? (
              <><Loader2 size={18} className="animate-spin" /> Generating care plan...</>
            ) : (
              <><Sparkles size={18} /> Generate Care Plan</>
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
