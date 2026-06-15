/**
 * Centralised Careroot email templates — all 16 transactional emails.
 * Returns { subject, html } for use with Resend.
 * Brand: cr-forest #1A3C2E, white body, Cormorant Garamond display, DM Sans body.
 */

const BASE = `
  <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#1A3C2E;padding:28px 32px">
      <span style="color:#fff;font-family:Georgia,serif;font-size:22px;font-weight:600;letter-spacing:0.5px">Careroot</span>
      <span style="color:rgba(255,255,255,0.55);font-size:13px;margin-left:8px">Care management platform</span>
    </div>
`;
const FOOT = `
    <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.6">
      Careroot · UK domiciliary care management · <a href="https://careroot.care" style="color:#1A3C2E">careroot.care</a><br>
      If you did not expect this email please ignore it or <a href="mailto:support@careroot.care" style="color:#1A3C2E">contact support</a>.
    </div>
  </div>
`;

function body(content: string) {
  return `${BASE}<div style="padding:28px 32px">${content}</div>${FOOT}`;
}

function h1(text: string) {
  return `<h1 style="font-family:Georgia,serif;color:#1A3C2E;font-size:22px;margin:0 0 16px">${text}</h1>`;
}

function p(text: string) {
  return `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 14px">${text}</p>`;
}

function btn(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background:#1A3C2E;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;margin:8px 0 20px">${label}</a>`;
}

function alert(text: string, colour = "#FEF3C7", border = "#F59E0B") {
  return `<div style="background:${colour};border-left:4px solid ${border};padding:14px 16px;border-radius:4px;margin-bottom:18px;font-size:14px;color:#374151">${text}</div>`;
}

function table(rows: [string, string][]) {
  const trs = rows.map(([k, v]) => `
    <tr>
      <td style="padding:10px 14px;background:#f9fafb;font-size:13px;color:#6b7280;font-weight:600;border:1px solid #e5e7eb;white-space:nowrap">${k}</td>
      <td style="padding:10px 14px;font-size:14px;color:#111827;border:1px solid #e5e7eb">${v}</td>
    </tr>`).join("");
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:20px">${trs}</table>`;
}

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care";

/* ─────────────────────────────────────────────
   1. Welcome / signup confirmation
───────────────────────────────────────────── */
export function welcomeEmail(firstName: string, orgName: string) {
  return {
    subject: `Welcome to Careroot, ${firstName} — your 30-day trial has started`,
    html: body(`
      ${h1(`Welcome to Careroot, ${firstName}`)}
      ${p(`Your account for <strong>${orgName}</strong> is ready. You have 30 days to explore every feature — no credit card required until you upgrade.`)}
      ${btn("Open your dashboard", `${APP}/dashboard`)}
      ${p("Here's what to do first:")}
      <ol style="color:#374151;font-size:14px;line-height:2;margin:0 0 18px;padding-left:20px">
        <li>Add your first client and set their care plan</li>
        <li>Invite your care coordinators and carers</li>
        <li>Schedule today's visits on the rota</li>
        <li>Generate an emergency QR card for each client</li>
      </ol>
      ${p("Questions? Reply to this email — we read every one.")}
    `),
  };
}

/* ─────────────────────────────────────────────
   2. Demo request confirmation (to requester)
───────────────────────────────────────────── */
export function demoRequestConfirmEmail(firstName: string) {
  return {
    subject: "We've received your Careroot demo request — you'll hear from us within 24 hours",
    html: body(`
      ${h1("Demo request received")}
      ${p(`Hi ${firstName}, thank you for requesting a Careroot demo.`)}
      ${p("We'll be in touch within <strong>24 hours</strong> to confirm a time. The session is 30 minutes, tailored to your care service — AI care planning, CQC compliance tools, the carer mobile app, and the emergency response system.")}
      ${btn("Start your free trial in the meantime", `${APP}/signup`)}
    `),
  };
}

/* ─────────────────────────────────────────────
   3. Demo request notification (to Careroot team)
───────────────────────────────────────────── */
export function demoRequestInternalEmail(data: {
  firstName: string;
  lastName: string;
  orgName: string;
  email: string;
  phone?: string;
  staffCount?: string;
  careType?: string;
  role?: string;
}) {
  return {
    subject: `New demo request — ${data.orgName} — ${data.staffCount ?? "?"} staff`,
    html: body(`
      ${h1("New demo request")}
      ${table([
        ["Name", `${data.firstName} ${data.lastName}`],
        ["Organisation", data.orgName],
        ["Email", data.email],
        ["Phone", data.phone ?? "—"],
        ["Staff count", data.staffCount ?? "—"],
        ["Care type", data.careType ?? "—"],
        ["Role", data.role ?? "—"],
      ])}
      ${btn("Log in to CRM", `${APP}/dashboard`)}
    `),
  };
}

/* ─────────────────────────────────────────────
   4. Subscription upgrade — welcome to paid plan
───────────────────────────────────────────── */
export function subscriptionWelcomeEmail(firstName: string, orgName: string, plan: string) {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  return {
    subject: `You're now on Careroot ${planLabel} — thank you`,
    html: body(`
      ${h1(`You're now on Careroot ${planLabel}`)}
      ${p(`Hi ${firstName}, your subscription for <strong>${orgName}</strong> is confirmed. All ${planLabel} features are now active.`)}
      ${btn("Go to your dashboard", `${APP}/dashboard`)}
      ${p("Need to add more staff seats or update your billing details?")}
      ${btn("Manage billing", `${APP}/settings?tab=billing`)}
    `),
  };
}

/* ─────────────────────────────────────────────
   5. Subscription cancelled
───────────────────────────────────────────── */
export function subscriptionCancelledEmail(firstName: string, orgName: string) {
  return {
    subject: "Your Careroot subscription has been cancelled",
    html: body(`
      ${h1("Subscription cancelled")}
      ${p(`Hi ${firstName}, your Careroot subscription for <strong>${orgName}</strong> has been cancelled.`)}
      ${p("Your data is safe and your account will remain accessible in read-only mode for 30 days. If you change your mind, simply reactivate at any time.")}
      ${btn("Reactivate subscription", `${APP}/pricing`)}
      ${p("We'd love to understand what we could have done better. <a href='mailto:feedback@careroot.care' style='color:#1A3C2E'>Drop us a note</a>.")}
    `),
  };
}

/* ─────────────────────────────────────────────
   6. Payment failed
───────────────────────────────────────────── */
export function paymentFailedEmail(firstName: string, retryDate: string) {
  return {
    subject: "Action required: Careroot payment failed",
    html: body(`
      ${alert("Your most recent Careroot payment did not go through.", "#FEF2F2", "#EF4444")}
      ${h1("Payment failed")}
      ${p(`Hi ${firstName}, we were unable to charge your card. We'll retry on <strong>${retryDate}</strong>.`)}
      ${p("To avoid any interruption to your service, please update your payment details.")}
      ${btn("Update payment method", `${APP}/settings?tab=billing`)}
    `),
  };
}

/* ─────────────────────────────────────────────
   7. Missed visit alert (to manager)
───────────────────────────────────────────── */
export function missedVisitEmail(data: {
  clientName: string;
  carerName: string;
  scheduledStart: string;
  visitId: string;
}) {
  return {
    subject: `⚠️ Missed visit — ${data.clientName} — ${data.scheduledStart}`,
    html: body(`
      ${alert("A visit has been marked as missed by the automated system.", "#FEF3C7", "#F59E0B")}
      ${h1("Missed visit alert")}
      ${table([
        ["Client", data.clientName],
        ["Assigned carer", data.carerName],
        ["Scheduled for", data.scheduledStart],
      ])}
      ${btn("Review visit", `${APP}/visits/${data.visitId}`)}
      ${p("Please follow your organisation's missed visit protocol. If the client cannot be contacted, consider a welfare check.")}
    `),
  };
}

/* ─────────────────────────────────────────────
   8. DBS expiry warning (to manager)
───────────────────────────────────────────── */
export function dbsExpiryEmail(data: {
  staffName: string;
  expiryDate: string;
  daysRemaining: number;
}) {
  const urgent = data.daysRemaining <= 30;
  return {
    subject: `${urgent ? "🔴 URGENT" : "⚠️"} DBS expiry — ${data.staffName} — ${data.daysRemaining} days remaining`,
    html: body(`
      ${urgent ? alert(`DBS certificate expires in <strong>${data.daysRemaining} days</strong>. Immediate action required.`, "#FEF2F2", "#EF4444") : alert(`DBS certificate expires in <strong>${data.daysRemaining} days</strong>. Renewal recommended.`, "#FEF3C7", "#F59E0B")}
      ${h1("DBS expiry reminder")}
      ${table([
        ["Staff member", data.staffName],
        ["Expiry date", data.expiryDate],
        ["Days remaining", String(data.daysRemaining)],
      ])}
      ${btn("View staff record", `${APP}/staff`)}
      ${p("The Update Service can check whether a certificate is still valid. Arrange renewal through the DBS online service or a registered umbrella body.")}
    `),
  };
}

/* ─────────────────────────────────────────────
   9. Emergency alert triggered (to manager/GP)
───────────────────────────────────────────── */
export function emergencyAlertEmail(data: {
  clientName: string;
  carerName: string;
  address: string;
  emergencyLink: string;
  pin: string;
  orgName: string;
  timestamp: string;
}) {
  return {
    subject: `🚨 Emergency alert — ${data.clientName} — ${data.timestamp}`,
    html: body(`
      ${alert("An emergency has been triggered for one of your clients. Call 999 if not already done.", "#FEF2F2", "#EF4444")}
      ${h1("Emergency alert")}
      ${table([
        ["Client", data.clientName],
        ["Triggered by", data.carerName],
        ["Location", data.address],
        ["Time", data.timestamp],
      ])}
      ${p(`<a href="${data.emergencyLink}" style="color:#1A3C2E;font-weight:600">Access emergency medical record →</a><br>PIN: <strong>${data.pin}</strong>`)}
      ${btn("View in Careroot", `${APP}/dashboard`)}
    `),
  };
}

/* ─────────────────────────────────────────────
   10. Emergency record accessed (to manager)
───────────────────────────────────────────── */
export function emergencyAccessEmail(data: {
  clientName: string;
  accessedAt: string;
  ip: string;
  accessCount: number;
}) {
  return {
    subject: `Emergency record accessed — ${data.clientName}`,
    html: body(`
      ${alert("A paramedic or emergency service has accessed this client's emergency medical record.", "#EFF6FF", "#3B82F6")}
      ${h1("Emergency record accessed")}
      ${table([
        ["Client", data.clientName],
        ["Accessed at", data.accessedAt],
        ["IP address", data.ip],
        ["Total accesses", String(data.accessCount)],
      ])}
      ${btn("View access log", `${APP}/clients`)}
    `),
  };
}

/* ─────────────────────────────────────────────
   11. AI risk flag — new critical flag (to manager)
───────────────────────────────────────────── */
export function riskFlagEmail(data: {
  clientName: string;
  flagType: string;
  summary: string;
  flagId: string;
}) {
  return {
    subject: `🔴 AI risk flag — ${data.clientName} — ${data.flagType}`,
    html: body(`
      ${alert("Careroot AI has detected a potential risk that requires your attention.", "#FEF2F2", "#EF4444")}
      ${h1("New AI risk flag")}
      ${table([
        ["Client", data.clientName],
        ["Flag type", data.flagType],
      ])}
      ${p(data.summary)}
      ${btn("Review flag", `${APP}/ai/risk-flags`)}
      ${p("This alert was generated automatically from visit note analysis. Review in context before taking action.")}
    `),
  };
}

/* ─────────────────────────────────────────────
   12. Family brief sent (to family member)
───────────────────────────────────────────── */
export function familyBriefEmail(data: {
  familyName: string;
  clientName: string;
  briefText: string;
  orgName: string;
}) {
  return {
    subject: `Update on ${data.clientName} from ${data.orgName}`,
    html: body(`
      ${h1(`Update on ${data.clientName}`)}
      ${p(`Hi ${data.familyName},`)}
      ${p("Here is a summary from the care team:")}
      <blockquote style="border-left:3px solid #1A3C2E;margin:0 0 20px;padding:14px 18px;background:#f9fafb;color:#374151;font-size:14px;line-height:1.7">
        ${data.briefText.replace(/\n/g, "<br>")}
      </blockquote>
      ${p(`If you have any questions please contact ${data.orgName} directly.`)}
    `),
  };
}

/* ─────────────────────────────────────────────
   13. New complaint acknowledged (to complainant)
───────────────────────────────────────────── */
export function complaintAcknowledgedEmail(data: {
  name: string;
  referenceNumber: string;
  orgName: string;
}) {
  return {
    subject: `Complaint received — reference ${data.referenceNumber}`,
    html: body(`
      ${h1("Complaint acknowledged")}
      ${p(`Dear ${data.name},`)}
      ${p(`We have received your complaint about <strong>${data.orgName}</strong> and will investigate within <strong>28 days</strong> as required by our complaints policy and CQC guidance.`)}
      ${table([
        ["Reference number", data.referenceNumber],
        ["Organisation", data.orgName],
      ])}
      ${p("If you have additional information to add, please reply to this email quoting your reference number.")}
    `),
  };
}

/* ─────────────────────────────────────────────
   14. New complaint notification (to manager)
───────────────────────────────────────────── */
export function complaintInternalEmail(data: {
  referenceNumber: string;
  submittedBy: string;
  category: string;
  description: string;
  severity: string;
}) {
  const urgent = data.severity === "critical" || data.severity === "high";
  return {
    subject: `${urgent ? "🔴 " : ""}New complaint — ${data.referenceNumber} — ${data.severity}`,
    html: body(`
      ${urgent ? alert("This complaint is rated high or critical severity and requires prompt review.", "#FEF2F2", "#EF4444") : ""}
      ${h1("New complaint received")}
      ${table([
        ["Reference", data.referenceNumber],
        ["Submitted by", data.submittedBy],
        ["Category", data.category],
        ["Severity", data.severity],
      ])}
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:20px;font-size:14px;color:#374151;line-height:1.7">
        ${data.description}
      </div>
      ${btn("Review complaint", `${APP}/complaints`)}
    `),
  };
}

/* ─────────────────────────────────────────────
   15. Password reset
───────────────────────────────────────────── */
export function passwordResetEmail(firstName: string, resetLink: string) {
  return {
    subject: "Reset your Careroot password",
    html: body(`
      ${h1("Password reset request")}
      ${p(`Hi ${firstName}, we received a request to reset your Careroot password.`)}
      ${btn("Reset password", resetLink)}
      ${p("This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.")}
    `),
  };
}

/* ─────────────────────────────────────────────
   16. Staff invitation
───────────────────────────────────────────── */
export function staffInviteEmail(data: {
  inviteeName: string;
  inviterName: string;
  orgName: string;
  role: string;
  inviteLink: string;
}) {
  const roleLabel = data.role.replace("_", " ");
  return {
    subject: `You've been invited to join ${data.orgName} on Careroot`,
    html: body(`
      ${h1(`Join ${data.orgName} on Careroot`)}
      ${p(`Hi ${data.inviteeName}, <strong>${data.inviterName}</strong> has invited you to join <strong>${data.orgName}</strong> as a <strong>${roleLabel}</strong>.`)}
      ${p("Careroot is the care management platform your organisation uses for scheduling, care plans, and compliance.")}
      ${btn("Accept invitation and set password", data.inviteLink)}
      ${p("This invitation expires in 7 days.")}
    `),
  };
}
