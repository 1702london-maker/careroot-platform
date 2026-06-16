"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CRCard } from "@/components/ui/CRCard";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRBadge } from "@/components/ui/CRBadge";
import { Crown, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body text-cr-charcoal focus:outline-none focus:ring-2 focus:ring-cr-forest focus:border-transparent bg-white";
const labelClass = "block text-xs font-body font-semibold text-cr-slate uppercase tracking-wide mb-1.5";

interface Props {
  org: Record<string, unknown>;
  orgId: string;
  domainRecord: Record<string, unknown> | null;
}

export function WhiteLabelSettings({ org, orgId, domainRecord }: Props) {
  const router = useRouter();
  const packageTier = org.wl_package_tier as string | null;

  const [branding, setBranding] = useState({
    wl_app_name: (org.wl_app_name as string) ?? "",
    wl_primary_colour: (org.wl_primary_colour as string) ?? "#1A3C2E",
    wl_secondary_colour: (org.wl_secondary_colour as string) ?? "#4A7C5E",
    wl_accent_colour: (org.wl_accent_colour as string) ?? "#C9A84C",
  });
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);

  const [newDomain, setNewDomain] = useState("");
  const [domainLoading, setDomainLoading] = useState(false);
  const [dnsRecords, setDnsRecords] = useState<Array<{ type: string; name: string; value: string; description: string }> | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; error?: string } | null>(null);

  const [emailFrom, setEmailFrom] = useState((org.wl_email_from as string) ?? "");
  const [supportEmail, setSupportEmail] = useState((org.wl_support_email as string) ?? "");
  const [emailSaving, setEmailSaving] = useState(false);

  const saveBranding = async () => {
    setBrandingSaving(true);
    await fetch("/api/white-label/save-branding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organisation_id: orgId, ...branding }),
    });
    setBrandingSaving(false);
    setBrandingSuccess(true);
    setTimeout(() => setBrandingSuccess(false), 3000);
    router.refresh();
  };

  const startDomainVerification = async () => {
    if (!newDomain.trim()) return;
    setDomainLoading(true);
    const res = await fetch("/api/white-label/verify-domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: newDomain.trim() }),
    });
    const data = await res.json();
    setDnsRecords(data.dns_records ?? null);
    setDomainLoading(false);
  };

  const checkDomain = async () => {
    const domain = (domainRecord?.domain as string) ?? newDomain;
    if (!domain) return;
    setVerifying(true);
    const res = await fetch("/api/white-label/check-domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });
    const data = await res.json();
    setVerifyResult(data);
    setVerifying(false);
    if (data.verified) router.refresh();
  };

  const saveEmail = async () => {
    setEmailSaving(true);
    await fetch("/api/white-label/save-branding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organisation_id: orgId, wl_email_from: emailFrom, wl_support_email: supportEmail }),
    });
    setEmailSaving(false);
    router.refresh();
  };

  const canCustomDomain = packageTier === "full" || packageTier === "enterprise";
  const canEmail = packageTier === "full" || packageTier === "enterprise";
  const canMobileApp = packageTier === "enterprise";

  return (
    <div>
      <CRPageHeader
        title="White Label"
        subtitle="Customise your brand, domain, and email settings"
        breadcrumbs={[{ label: "Settings", href: "/settings/organisation" }]}
        action={
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-cr-gold" />
            <span className="text-sm font-body font-semibold text-cr-charcoal capitalize">{packageTier ?? "basic"} white label</span>
          </div>
        }
      />

      <div className="space-y-6 max-w-2xl">
        {/* Section 1 — Branding */}
        <CRCard>
          <h2 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Branding</h2>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>App name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Premier Care"
                value={branding.wl_app_name}
                onChange={(e) => setBranding({ ...branding, wl_app_name: e.target.value })}
              />
              <p className="text-xs text-cr-slate mt-1">What staff and families see instead of &quot;Careroot&quot;</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Primary colour</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    value={branding.wl_primary_colour}
                    onChange={(e) => setBranding({ ...branding, wl_primary_colour: e.target.value })}
                  />
                  <input
                    type="text"
                    className={`${inputClass} font-mono`}
                    value={branding.wl_primary_colour}
                    onChange={(e) => setBranding({ ...branding, wl_primary_colour: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Secondary colour</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    value={branding.wl_secondary_colour}
                    onChange={(e) => setBranding({ ...branding, wl_secondary_colour: e.target.value })}
                  />
                  <input
                    type="text"
                    className={`${inputClass} font-mono`}
                    value={branding.wl_secondary_colour}
                    onChange={(e) => setBranding({ ...branding, wl_secondary_colour: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Accent colour</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    value={branding.wl_accent_colour}
                    onChange={(e) => setBranding({ ...branding, wl_accent_colour: e.target.value })}
                  />
                  <input
                    type="text"
                    className={`${inputClass} font-mono`}
                    value={branding.wl_accent_colour}
                    onChange={(e) => setBranding({ ...branding, wl_accent_colour: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: branding.wl_primary_colour }}
              >
                <div className="w-6 h-6 bg-white/20 rounded-md" />
                <span className="text-white font-display font-semibold text-sm">{branding.wl_app_name || "Your App Name"}</span>
              </div>
              <div className="bg-gray-50 px-4 py-3">
                <p className="text-xs text-cr-slate font-body">Sidebar preview — colours update live</p>
              </div>
            </div>

            <button
              onClick={saveBranding}
              disabled={brandingSaving}
              className="cr-btn-primary px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {brandingSuccess && <CheckCircle size={15} />}
              {brandingSaving ? "Saving…" : brandingSuccess ? "Saved!" : "Save branding"}
            </button>
          </div>
        </CRCard>

        {/* Section 2 — Domain */}
        <CRCard className={!canCustomDomain ? "opacity-60" : ""}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-cr-charcoal">Custom Domain</h2>
            {!canCustomDomain && <CRBadge variant="slate" size="sm">Full or Enterprise only</CRBadge>}
          </div>

          {domainRecord && (
            <div className="bg-cr-mint rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-body font-semibold text-cr-charcoal">{domainRecord.domain as string}</span>
                <CRBadge variant={(domainRecord.verified as boolean) ? "green" : "amber"} size="sm">
                  {(domainRecord.verified as boolean) ? "Verified" : "Pending verification"}
                </CRBadge>
              </div>
            </div>
          )}

          {canCustomDomain && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Add custom domain</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="premiercare.co.uk"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                  <button
                    onClick={startDomainVerification}
                    disabled={domainLoading || !newDomain.trim()}
                    className="cr-btn-primary px-4 py-2.5 text-sm whitespace-nowrap disabled:opacity-50"
                  >
                    {domainLoading ? "…" : "Get DNS records"}
                  </button>
                </div>
              </div>

              {dnsRecords && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-body font-semibold text-cr-charcoal">Add these records to your domain registrar:</p>
                  {dnsRecords.map((r) => (
                    <div key={r.type + r.name} className="bg-white rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-0.5 bg-cr-mint text-cr-forest text-xs font-body font-bold rounded">{r.type}</span>
                        <span className="text-xs font-mono text-cr-charcoal font-semibold">{r.name}</span>
                        <span className="text-xs text-cr-slate">→</span>
                        <span className="text-xs font-mono text-cr-forest break-all">{r.value}</span>
                      </div>
                      <p className="text-xs text-cr-slate">{r.description}</p>
                    </div>
                  ))}
                  <button
                    onClick={checkDomain}
                    disabled={verifying}
                    className="flex items-center gap-2 text-sm font-body font-semibold text-cr-forest hover:text-cr-sage transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={verifying ? "animate-spin" : ""} />
                    {verifying ? "Checking DNS…" : "Verify domain"}
                  </button>
                  {verifyResult && (
                    <div className={`flex items-center gap-2 text-sm font-body ${verifyResult.verified ? "text-green-700" : "text-cr-slate"}`}>
                      {verifyResult.verified
                        ? <><CheckCircle size={14} /> Domain verified successfully!</>
                        : <><AlertCircle size={14} /> {verifyResult.error ?? "Not verified yet — DNS may take up to 24 hours to propagate"}</>
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CRCard>

        {/* Section 3 — Email */}
        <CRCard className={!canEmail ? "opacity-60" : ""}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-cr-charcoal">Email Settings</h2>
            {!canEmail && <CRBadge variant="slate" size="sm">Full or Enterprise only</CRBadge>}
          </div>

          {canEmail && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>From email address</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="noreply@premiercare.co.uk"
                  value={emailFrom}
                  onChange={(e) => setEmailFrom(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Support email</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="support@premiercare.co.uk"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-xs font-body text-amber-800">
                  You must verify your domain with Resend before emails can send from your domain.{" "}
                  <a href="https://resend.com/docs/dashboard/domains/introduction" target="_blank" rel="noreferrer" className="underline">
                    Resend domain verification →
                  </a>
                </p>
              </div>
              <button
                onClick={saveEmail}
                disabled={emailSaving}
                className="cr-btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {emailSaving ? "Saving…" : "Save email settings"}
              </button>
            </div>
          )}
        </CRCard>

        {/* Section 4 — Mobile App */}
        <CRCard className={!canMobileApp ? "opacity-60" : ""}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-cr-charcoal">Mobile App</h2>
            {!canMobileApp && <CRBadge variant="slate" size="sm">Enterprise only</CRBadge>}
          </div>

          {canMobileApp ? (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Play Store URL</label>
                <input type="url" className={inputClass} placeholder="https://play.google.com/store/apps/details?id=..." />
              </div>
              <div>
                <label className={labelClass}>App Store URL</label>
                <input type="url" className={inputClass} placeholder="https://apps.apple.com/app/..." />
              </div>
              <p className="text-xs text-cr-slate">
                Submit your branded APK to the Play Store under your developer account. Contact your Careroot account manager to receive your custom build.
              </p>
            </div>
          ) : (
            <p className="text-sm font-body text-cr-slate">
              Upgrade to Enterprise white label to list your own branded app in the Play Store and App Store.
            </p>
          )}
        </CRCard>
      </div>
    </div>
  );
}
