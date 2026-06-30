/**
 * Centralised compliance notification routing (BUILD_SPEC B22).
 * Resolves recipients by role within an organisation and sends via Twilio SMS.
 *
 * Note on lead roles: the `users.role` enum has no dedicated safeguarding/HR/
 * compliance lead. Until those are added, lead-targeted alerts route to
 * org_admin + manager (the responsible parties), so a notification is never
 * dropped silently. Add `org_settings.safeguarding_lead_id` etc. later to
 * target named individuals.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendSMS } from "@/lib/twilio";

// Logical recipient groups → concrete user roles.
const ROLE_GROUPS: Record<string, string[]> = {
  manager: ["org_admin", "manager"],
  on_call_manager: ["org_admin", "manager"],
  safeguarding_lead: ["org_admin", "manager"],
  hr_lead: ["org_admin", "manager"],
  compliance_lead: ["org_admin", "manager"],
  data_protection_lead: ["org_admin", "manager"],
};

export type NotifyArgs = {
  organisationId: string;
  recipientGroups: string[]; // e.g. ["manager", "safeguarding_lead"]
  message: string;
  /** Extra explicit staff ids to notify (e.g. the worker on shift). */
  extraStaffIds?: string[];
};

/**
 * Send a compliance SMS to everyone in the named recipient groups for an org.
 * Best-effort: failures are logged, never thrown — a notification failure must
 * not roll back the underlying compliance record.
 */
export async function notify(
  supabase: SupabaseClient,
  { organisationId, recipientGroups, message, extraStaffIds = [] }: NotifyArgs
): Promise<{ sent: number; failed: number }> {
  const roles = Array.from(
    new Set(recipientGroups.flatMap((g) => ROLE_GROUPS[g] ?? [g]))
  );

  const phones = new Set<string>();

  try {
    if (roles.length) {
      const { data: roleUsers } = await supabase
        .from("users")
        .select("phone")
        .eq("organisation_id", organisationId)
        .in("role", roles)
        .eq("is_active", true);
      for (const u of roleUsers ?? []) if (u.phone) phones.add(u.phone);
    }
    if (extraStaffIds.length) {
      const { data: staff } = await supabase
        .from("users")
        .select("phone")
        .in("id", extraStaffIds);
      for (const u of staff ?? []) if (u.phone) phones.add(u.phone);
    }
  } catch (e) {
    console.error("[notify] recipient lookup failed:", e);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  for (const phone of phones) {
    const res = await sendSMS(phone, message);
    if (res.success) sent++;
    else failed++;
  }
  return { sent, failed };
}

/** Pre-built message templates mirroring BUILD_SPEC NOTIFICATION_ROUTES. */
export const messages = {
  medicationMissed: (medication: string, client: string, time: string) =>
    `MEDICATION ALERT: ${medication} for ${client} was due at ${time}. Please log immediately or contact your manager.`,
  safeguardingStandard: (staff: string, client: string, ts: string) =>
    `SAFEGUARDING CONCERN logged by ${staff} for ${client} at ${ts}. Immediate review required.`,
  safeguardingBypass: (staff: string, client: string) =>
    `DIRECT SAFEGUARDING CONCERN from ${staff} for ${client}. This has bypassed line management. Immediate review required.`,
  incidentLogged: (type: string, client: string, ts: string, staff: string) =>
    `INCIDENT LOGGED: ${type} for ${client} at ${ts} by ${staff}. Review required immediately.`,
  roleBoundary: (staff: string, task: string, client: string, response: string) =>
    `ROLE BOUNDARY: ${staff} reported being asked to perform "${task}" for ${client}. Response: ${response}.`,
  verbalAbuse: (staff: string, perpetrator: string, client: string) =>
    `VERBAL ABUSE REPORTED: ${staff} reported verbal abuse from ${perpetrator} during a visit to ${client}.`,
  triggerActivated: (client: string, terms: string) =>
    `TRIGGER ALERT: Trigger vocabulary (${terms}) detected in a shift log for ${client}. Please review.`,
  postIncidentWellbeingDue: (staff: string) =>
    `WELLBEING CHECK DUE: 24 hours have passed since the incident involving ${staff}. A wellbeing check has not been completed.`,
  shiftCredential: (pin: string, start: string, expiry: string) =>
    `Your Careroot shift PIN for today is: ${pin}. Valid from ${start} to ${expiry}. Do not share this PIN.`,
  sarReceived: (client: string, due: string) =>
    `SAR RECEIVED: Subject access request received for ${client}. Due date: ${due}. 30-day legal deadline applies.`,
};
