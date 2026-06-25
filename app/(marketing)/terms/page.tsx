import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Careroot",
  description: "Careroot's terms of service for care management software subscriptions.",
};

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: `By accessing or using the Careroot platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using Careroot on behalf of an organisation, you represent that you have authority to bind that organisation to these Terms.

If you do not agree to these Terms, you may not use the Service.`,
  },
  {
    title: "2. Description of service",
    body: `Careroot is a cloud-based care management platform for UK care providers, including domiciliary, supported living, residential, NHS community, and other regulated care services. The Service includes care planning, visit management, CQC compliance tools, AI-powered features, emergency response functionality, family portal access, payroll, and invoicing tools.

We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.`,
  },
  {
    title: "3. Account registration and security",
    body: `You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials. You must notify us immediately at onboarding@careroot.co.uk if you suspect unauthorised access.

Each account is for use by one organisation. You must not share login credentials or allow multiple organisations to use a single account.`,
  },
  {
    title: "4. Acceptable use",
    body: `You agree to use Careroot only for lawful purposes and in accordance with these Terms. You must not:

- Use the Service to store, transmit, or process unlawful content
- Attempt to gain unauthorised access to any part of the Service or its infrastructure
- Use automated tools to scrape, crawl, or harvest data from the platform
- Resell or sublicense access to the Service without our written consent
- Use the Service to process data of individuals without appropriate lawful basis under UK GDPR`,
  },
  {
    title: "5. Data ownership and processing",
    body: `You retain full ownership of all data you enter into Careroot ("Customer Data"). We process Customer Data solely to provide and improve the Service, as described in our Privacy Policy.

You are the data controller for all personal data of your clients, staff, and family members. We act as the data processor. A Data Processing Agreement (DPA) is available on request at onboarding@careroot.co.uk.

You are responsible for ensuring you have appropriate lawful basis to collect and process care data under UK GDPR.`,
  },
  {
    title: "6. AI features",
    body: `Careroot includes AI-powered features including care plan drafts, risk analysis, family briefings, and compliance scoring. These features are provided as assistance tools only.

AI-generated content must be reviewed, verified, and approved by a qualified professional before use in clinical or care decision-making. Careroot is not responsible for decisions made solely on the basis of AI-generated content without human review.`,
  },
  {
    title: "7. Pricing and payment",
    body: `Paid plans are billed monthly in advance. Prices are as listed at careroot.co.uk/pricing. We reserve the right to change pricing with 30 days written notice.

Free trials run for 30 days with no credit card required. After 30 days, the account enters a paused state unless upgraded. No charge is applied during or after the trial without explicit consent.

All prices are in GBP and exclusive of VAT where applicable.`,
  },
  {
    title: "8. Cancellation and refunds",
    body: `You may cancel your subscription at any time from your billing settings. Cancellation takes effect at the end of the current billing period. No partial refunds are issued for unused time within a billing period.

If we terminate your account for breach of these Terms, no refund will be provided.`,
  },
  {
    title: "9. Service availability",
    body: `We aim to maintain 99.9% uptime for the Careroot platform. Planned maintenance will be communicated in advance. We are not liable for downtime caused by circumstances beyond our reasonable control, including third-party infrastructure failures.

The Careroot carer app includes offline functionality designed to maintain access to critical care information during connectivity outages.`,
  },
  {
    title: "10. Limitation of liability",
    body: `To the maximum extent permitted by law, Careroot AI Limited shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.

Our total liability to you for any claim arising under these Terms shall not exceed the total amount you paid to us in the 12 months preceding the claim.

Nothing in these Terms excludes liability for death or personal injury caused by negligence, or for fraud or fraudulent misrepresentation.`,
  },
  {
    title: "11. Intellectual property",
    body: `The Careroot platform, including all software, design, branding, and content, is owned by Careroot AI Limited and protected by UK and international intellectual property laws.

We grant you a limited, non-exclusive, non-transferable licence to use the Service solely for your internal business purposes during your subscription.`,
  },
  {
    title: "12. Governing law",
    body: `These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.

If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.`,
  },
  {
    title: "13. Changes to these terms",
    body: `We may update these Terms from time to time. Material changes will be communicated by email with at least 14 days notice. Continued use of the Service after the effective date constitutes acceptance.

These Terms were last updated in June 2026.`,
  },
  {
    title: "14. Contact",
    body: `For questions about these Terms, contact us at:

**Email:** onboarding@careroot.co.uk
**Company:** Careroot AI Limited, registered in England and Wales
**Company number:** 16796060
**Registered office:** 71–75 Shelton Street, Covent Garden, London WC2H 9JQ`,
  },
];

export default function TermsPage() {
  return (
    <>
      <MarketingNav />
      <main className="bg-cr-ivory min-h-screen pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block text-xs font-body font-semibold uppercase tracking-widest text-cr-forest bg-cr-mint px-3 py-1.5 rounded-full mb-5">Legal</span>
          <h1 className="font-display text-4xl text-cr-charcoal mb-2">Terms of Service</h1>
          <p className="text-sm text-cr-slate font-body mb-2">Last updated: June 2026 · Careroot AI Limited</p>
          <p className="text-xs text-cr-slate font-body mb-10">Company No. 16796060 · Registered in England and Wales · 71–75 Shelton Street, Covent Garden, London WC2H 9JQ</p>

          <div className="space-y-10">
            {SECTIONS.map((section, i) => (
              <section key={i}>
                <h2 className="font-display text-xl text-cr-charcoal mb-3">{section.title}</h2>
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
              Questions? Email us
            </a>
            <a href="/privacy" className="inline-flex items-center gap-2 text-sm font-body text-cr-slate hover:text-cr-forest transition-colors px-4 py-2">
              Privacy Policy →
            </a>
            <a href="/cookies" className="inline-flex items-center gap-2 text-sm font-body text-cr-slate hover:text-cr-forest transition-colors px-4 py-2">
              Cookie Policy →
            </a>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
