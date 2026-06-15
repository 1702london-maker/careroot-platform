"use client";

import { CRCard } from "@/components/ui/CRCard";
import { CRAlertBanner } from "@/components/ui/CRAlertBanner";
import { QrCode, ExternalLink, Printer, Shield } from "lucide-react";

interface Props {
  client: Record<string, unknown>;
  emergencyToken: string | null;
}

export function ClientEmergencyTab({ client, emergencyToken }: Props) {
  const emergencyUrl = emergencyToken ? `https://careroot.care/emergency/${emergencyToken}` : null;
  const emergencyContacts = (client.emergency_contact as Array<Record<string, string>>) || [];
  const gpDetails = client.gp_details as Record<string, string> | null;
  const allergies = (client.allergies as Array<Record<string, string>>) || [];
  const medications = (client.medications as Array<Record<string, string>>) || [];

  const printCard = () => {
    const win = window.open("", "_blank");
    if (!win || !emergencyToken) return;
    win.document.write(`
      <html><head><title>Emergency Card</title>
      <style>body{font-family:sans-serif;padding:20px;max-width:400px}
      .header{background:#1A3C2E;color:white;padding:16px;border-radius:8px}
      .url{font-size:11px;word-break:break-all;color:#6B7280;margin:8px 0}
      p{margin:4px 0;font-size:14px}</style></head>
      <body>
        <div class="header"><h2 style="margin:0">Emergency Medical Access</h2>
        <p style="margin:4px 0 0;opacity:0.8">${client.first_name} ${client.last_name}</p></div>
        <p class="url">${emergencyUrl}</p>
        <p><strong>DOB:</strong> ${client.date_of_birth}</p>
        <p><strong>NHS:</strong> ${client.nhs_number || 'Not recorded'}</p>
        ${client.dnr_status ? '<p style="color:red;font-weight:bold">⚠️ DNR ORDER IN PLACE</p>' : ''}
        <p><strong>GP:</strong> ${gpDetails?.name || ''} — ${gpDetails?.phone || ''}</p>
      </body></html>
    `);
    win.print();
  };

  return (
    <div className="space-y-6">
      {client.dnr_status && (
        <CRAlertBanner
          variant="red"
          title="DNR ORDER IN PLACE"
          description="This client has a valid Do Not Resuscitate order. Always confirmed on the emergency access page."
        />
      )}

      {/* Emergency QR access */}
      {emergencyToken ? (
        <CRCard>
          <div className="flex items-center gap-2 mb-4">
            <QrCode size={20} className="text-cr-forest" />
            <h3 className="font-display text-lg font-semibold text-cr-charcoal">Paramedic Emergency Access</h3>
          </div>
          <p className="text-sm font-body text-cr-slate mb-4">
            Paramedics can scan the QR code on the emergency card or visit the URL below. A 6-digit PIN is required.
          </p>
          <div className="bg-cr-mint rounded-xl p-4 mb-4">
            <p className="text-xs text-cr-slate mb-1">Emergency access URL</p>
            <a
              href={emergencyUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-body text-cr-forest hover:underline flex items-center gap-1 break-all"
            >
              {emergencyUrl} <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex gap-3">
            <button
              onClick={printCard}
              className="flex items-center gap-2 px-4 py-2.5 bg-cr-forest text-white rounded-lg text-sm font-body hover:bg-cr-sage"
            >
              <Printer size={16} /> Print Emergency Card
            </button>
          </div>
        </CRCard>
      ) : (
        <CRCard>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={20} className="text-cr-slate" />
            <h3 className="font-display text-lg font-semibold text-cr-charcoal">Emergency Access Not Set Up</h3>
          </div>
          <p className="text-sm text-cr-slate">Complete client onboarding to generate an emergency access token.</p>
        </CRCard>
      )}

      {/* Critical information summary */}
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Critical Medical Information</h3>
        <div className="space-y-4">
          {allergies.length > 0 && (
            <div>
              <p className="text-xs font-body font-semibold text-cr-red uppercase tracking-wide mb-2">ALLERGIES</p>
              <div className="space-y-1">
                {allergies.map((a, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="font-body text-cr-charcoal">{a.name}</span>
                    <span className={`font-body capitalize ${a.severity === "anaphylactic" || a.severity === "severe" ? "text-cr-red font-bold" : "text-cr-slate"}`}>
                      {a.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gpDetails && (
            <div>
              <p className="text-xs font-body font-semibold text-cr-charcoal uppercase tracking-wide mb-2">GP CONTACT</p>
              <p className="text-sm font-body text-cr-charcoal">{gpDetails.name} — {gpDetails.surgery}</p>
              {gpDetails.phone && <a href={`tel:${gpDetails.phone}`} className="text-sm text-cr-forest">{gpDetails.phone}</a>}
            </div>
          )}

          {emergencyContacts.length > 0 && (
            <div>
              <p className="text-xs font-body font-semibold text-cr-charcoal uppercase tracking-wide mb-2">EMERGENCY CONTACTS</p>
              {emergencyContacts.slice(0, 3).map((c, i) => (
                <div key={i} className="flex justify-between text-sm mb-1">
                  <span className="font-body text-cr-charcoal">{c.name} ({c.relationship})</span>
                  <a href={`tel:${c.phone}`} className="text-cr-forest">{c.phone}</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </CRCard>
    </div>
  );
}
