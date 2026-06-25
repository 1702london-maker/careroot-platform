"use client";

import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRAvatar } from "@/components/ui/CRAvatar";
import { formatDateTimeUK } from "@/lib/utils";
import { Phone, Mail, Users } from "lucide-react";

interface Props {
  client: Record<string, unknown>;
  recentVisits: Record<string, unknown>[];
  familyAccess: Record<string, unknown>[];
}

export function ClientOverviewTab({ client, recentVisits, familyAccess }: Props) {
  const emergencyContacts = (client.emergency_contact as Array<Record<string, string>>) || [];
  const careNeeds = client.care_needs as Record<string, unknown> | null;
  const gpDetails = client.gp_details as Record<string, string> | null;

  const completedVisits = recentVisits.filter((v) => v.status === "completed").length;
  const missedVisits = recentVisits.filter((v) => v.status === "missed").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Quick stats */}
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-4">Recent Activity</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Visits (30d)", value: recentVisits.length },
            { label: "Completed", value: completedVisits, color: "text-green-600" },
            { label: "Missed", value: missedVisits, color: missedVisits > 0 ? "text-cr-red" : "text-cr-slate" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className={`text-2xl font-bold font-body ${stat.color || "text-cr-charcoal"}`}>{stat.value}</p>
              <p className="text-xs font-body text-cr-slate">{stat.label}</p>
            </div>
          ))}
        </div>
      </CRCard>

      {/* Care needs summary */}
      {careNeeds && (
        <CRCard>
          <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">Care Needs Summary</h3>
          <div className="space-y-2 text-sm font-body">
            {careNeeds.visit_frequency != null && (
              <div className="flex justify-between">
                <span className="text-cr-slate">Visit frequency</span>
                <span className="text-cr-charcoal font-medium">{String(careNeeds.visit_frequency)}</span>
              </div>
            )}
            {careNeeds.visit_duration_minutes != null && (
              <div className="flex justify-between">
                <span className="text-cr-slate">Duration</span>
                <span className="text-cr-charcoal font-medium">{String(careNeeds.visit_duration_minutes)} min</span>
              </div>
            )}
            {careNeeds.preferred_carer_gender != null && (
              <div className="flex justify-between">
                <span className="text-cr-slate">Carer preference</span>
                <span className="text-cr-charcoal font-medium capitalize">{String(careNeeds.preferred_carer_gender)}</span>
              </div>
            )}
          </div>
        </CRCard>
      )}

      {/* GP details */}
      {gpDetails && (
        <CRCard>
          <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">GP Details</h3>
          <div className="space-y-2 text-sm font-body">
            <p className="font-medium text-cr-charcoal">{gpDetails.name}</p>
            <p className="text-cr-slate">{gpDetails.surgery}</p>
            {gpDetails.phone && (
              <a href={`tel:${gpDetails.phone}`} className="flex items-center gap-1.5 text-cr-forest">
                <Phone size={12} /> {gpDetails.phone}
              </a>
            )}
            {gpDetails.email && (
              <a href={`mailto:${gpDetails.email}`} className="flex items-center gap-1.5 text-cr-forest">
                <Mail size={12} /> {gpDetails.email}
              </a>
            )}
          </div>
        </CRCard>
      )}

      {/* Emergency contacts */}
      <CRCard>
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">Emergency Contacts</h3>
        {emergencyContacts.length === 0 ? (
          <p className="text-sm text-cr-slate">No emergency contacts recorded</p>
        ) : (
          <div className="space-y-3">
            {emergencyContacts.map((contact, i) => (
              <div key={i} className="flex items-center gap-3">
                <CRAvatar name={contact.name} size="sm" />
                <div>
                  <p className="text-sm font-body font-medium text-cr-charcoal">{contact.name}</p>
                  <p className="text-xs font-body text-cr-slate">{contact.relationship}</p>
                  <a href={`tel:${contact.phone}`} className="text-xs text-cr-forest">{contact.phone}</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CRCard>

      {/* Family portal access */}
      <CRCard>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-cr-forest" />
          <h3 className="font-display text-lg font-semibold text-cr-charcoal">Family Portal Access</h3>
        </div>
        {familyAccess.length === 0 ? (
          <p className="text-sm text-cr-slate">No family portal access granted</p>
        ) : (
          <div className="space-y-2">
            {familyAccess.map((fa, i) => {
              const user = fa.users as Record<string, string> | null;
              return (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-body text-cr-charcoal">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-cr-slate">{user?.email}</p>
                  </div>
                  <CRBadge variant="green">{String(fa.access_level)}</CRBadge>
                </div>
              );
            })}
          </div>
        )}
      </CRCard>

      {/* Recent visits */}
      <CRCard className="md:col-span-2">
        <h3 className="font-display text-lg font-semibold text-cr-charcoal mb-3">Recent Visits</h3>
        {recentVisits.length === 0 ? (
          <p className="text-sm text-cr-slate">No visits recorded</p>
        ) : (
          <div className="space-y-2">
            {recentVisits.slice(0, 5).map((visit) => {
              const carer = visit.users as Record<string, string> | null;
              return (
                <div key={String(visit.id)} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-body text-cr-charcoal">{formatDateTimeUK(String(visit.scheduled_start))}</p>
                    <p className="text-xs text-cr-slate">{carer ? `${carer.first_name} ${carer.last_name}` : "Unassigned"}</p>
                  </div>
                  <CRBadge variant={visit.status === "completed" ? "green" : visit.status === "missed" ? "red" : "slate"}>
                    {String(visit.status)}
                  </CRBadge>
                </div>
              );
            })}
          </div>
        )}
      </CRCard>
    </div>
  );
}
