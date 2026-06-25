import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const SECTIONS = [
  {
    title: "Who we are",
    body: `Careroot Ltd is a software company registered in England and Wales. We provide a cloud-based care management platform for UK domiciliary and supported living providers. Our registered address and ICO registration details are available on request. Contact us at onboarding@careroot.co.uk.`,
  },
  {
    title: "What data we collect",
    body: `We collect data in two contexts:

**As a platform provider (your organisation's data):** When you sign up, we collect your name, email, organisation name, and billing information. As you use Careroot, the platform stores care data you enter — client records, visit notes, care plans, medications, incidents, and related information. This data belongs to your organisation; you are the data controller and we are the data processor.

**As a website visitor:** When you visit careroot.co.uk, we collect anonymous usage data via Vercel Analytics. This does not identify individuals.`,
  },
  {
    title: "How we use your data",
    body: `We use data solely to provide and improve the Careroot platform:

- To operate your account and deliver the service
- To send transactional emails (visit confirmations, alerts, invoices)
- To detect and prevent fraud and security incidents
- To comply with legal obligations

We do not sell data to third parties. We do not use care data for advertising or AI training without explicit consent.`,
  },
  {
    title: "Data storage and security",
    body: `All data is stored in UK-based infrastructure (Supabase, hosted on AWS EU-West-2). Data is encrypted at rest using AES-256 and in transit using TLS 1.3. Access is controlled via Row Level Security — each organisation can only access its own data.

We maintain SOC 2 Type II compliant infrastructure. API keys and credentials are stored as environment secrets and are never exposed to the client.`,
  },
  {
    title: "Data retention",
    body: `Active account data is retained for as long as your subscription is active. If you cancel, data is retained for 90 days to allow export and reactivation. After 90 days, data is permanently deleted from all systems.

You can request immediate deletion at any time by emailing onboarding@careroot.co.uk. Deletion is completed within 30 days.`,
  },
  {
    title: "Your rights under UK GDPR",
    body: `As a data subject, you have the right to:

- **Access** — request a copy of the data we hold about you
- **Rectification** — request correction of inaccurate data
- **Erasure** — request deletion of your data ("right to be forgotten")
- **Portability** — receive your data in a machine-readable format
- **Restriction** — request we restrict processing of your data
- **Object** — object to processing based on legitimate interests

To exercise any of these rights, contact us at onboarding@careroot.co.uk. We will respond within 30 days.`,
  },
  {
    title: "Third-party processors",
    body: `We use the following sub-processors to deliver the Careroot platform:

- **Supabase** — database hosting and authentication (EU-West-2, AWS)
- **Vercel** — application hosting and deployment (EU region)
- **Resend** — transactional email delivery
- **Stripe** — payment processing (PCI DSS Level 1 certified)
- **Twilio** — SMS notifications for emergency alerts
- **Anthropic** — AI features (care plan drafts, risk analysis, family briefs)

A full Data Processing Agreement (DPA) is available on request.`,
  },
  {
    title: "Cookies",
    body: `We use strictly necessary cookies for authentication (Supabase session cookies) and anonymous analytics (Vercel Analytics). We do not use advertising or tracking cookies. See our Cookie Policy at careroot.co.uk/cookies for full details.`,
  },
  {
    title: "Changes to this policy",
    body: `We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email and update the "Last updated" date below. Continued use of Careroot after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: "Contact us",
    body: `For privacy-related enquiries, data subject requests, or to request a Data Processing Agreement:

**Email:** onboarding@careroot.co.uk
**Subject line:** Privacy Request

We aim to respond within 5 working days and will complete all requests within 30 days.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <MarketingNav />
      <main className="bg-cr-ivory min-h-screen pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block text-xs font-body font-semibold uppercase tracking-widest text-cr-forest bg-cr-mint px-3 py-1.5 rounded-full mb-5">Legal</span>
          <h1 className="font-display text-5xl text-cr-charcoal mb-2">Privacy Policy</h1>
          <p className="text-sm text-cr-slate font-body mb-10">Last updated: June 2026 · Careroot Ltd</p>

          <div className="space-y-10">
            {SECTIONS.map((section, i) => (
              <section key={i}>
                <h2 className="font-display text-2xl text-cr-charcoal mb-3">{section.title}</h2>
                <div className="text-sm font-body text-cr-slate leading-relaxed space-y-3">
                  {section.body.split("\n\n").map((para, j) => (
                    <p key={j} className="whitespace-pre-line">{para}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
            <a href="mailto:onboarding@careroot.co.uk" className="inline-flex items-center gap-2 text-sm font-body font-semibold text-cr-forest border border-cr-forest px-4 py-2 rounded-btn hover:bg-cr-mint transition-colors">
              Contact for DPA / Data Requests
            </a>
            <a href="/cookies" className="inline-flex items-center gap-2 text-sm font-body text-cr-slate hover:text-cr-forest transition-colors px-4 py-2">
              Cookie Policy →
            </a>
            <a href="/terms" className="inline-flex items-center gap-2 text-sm font-body text-cr-slate hover:text-cr-forest transition-colors px-4 py-2">
              Terms of Service →
            </a>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
