import Link from "next/link";
import { CheckCircle, Leaf } from "lucide-react";

const plans = [
  {
    name: "Seed",
    price: 49,
    staff: "Up to 10 staff",
    desc: "Perfect for new care agencies preparing for CQC registration.",
    features: [
      "Up to 10 staff accounts",
      "Unlimited clients",
      "AI care plan drafts",
      "CQC compliance dashboard",
      "Mobile carer app",
      "Family portal",
      "Emergency SOS + paramedic access",
      "Email support",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Grow",
    price: 199,
    staff: "Up to 50 staff",
    desc: "For growing care agencies managing multiple teams.",
    features: [
      "Everything in Seed",
      "Up to 50 staff accounts",
      "AI risk flags and insights",
      "Rota and scheduling",
      "Medication management (eMAR)",
      "Complaints management",
      "Weekly AI family briefings",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Scale",
    price: 599,
    staff: "Up to 200 staff",
    desc: "For larger care organisations with multiple services.",
    features: [
      "Everything in Grow",
      "Up to 200 staff accounts",
      "Ofsted compliance module",
      "Advanced reports and analytics",
      "Custom care plan templates",
      "API access",
      "Dedicated account manager",
      "Phone and video support",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: null,
    staff: "Unlimited staff",
    desc: "For large care groups and NHS community care teams.",
    features: [
      "Everything in Scale",
      "Unlimited staff accounts",
      "Custom integrations",
      "SLA guarantee",
      "On-site training",
      "Data export and migration support",
      "White-label option",
      "Dedicated implementation team",
    ],
    cta: "Contact us",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-cr-ivory font-body">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cr-forest rounded-lg flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-cr-charcoal">Careroot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-body text-cr-slate hover:text-cr-charcoal">Sign in</Link>
            <Link href="/signup" className="cr-btn-primary text-sm px-4 py-2">Start free trial</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-cr-charcoal mb-4">
            Simple, transparent pricing.
          </h1>
          <p className="text-base font-body text-cr-slate max-w-xl mx-auto">
            30-day free trial on all plans. No credit card required. Cancel any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 flex flex-col ${
                plan.highlight
                  ? "bg-cr-forest text-white border-cr-forest shadow-lg scale-105"
                  : "bg-white border-gray-100"
              }`}
            >
              {plan.highlight && (
                <div className="text-center mb-3">
                  <span className="px-2 py-0.5 bg-cr-gold text-white text-xs font-body font-semibold rounded-full">
                    Most popular
                  </span>
                </div>
              )}
              <h2 className={`font-display text-xl font-semibold mb-1 ${plan.highlight ? "text-white" : "text-cr-charcoal"}`}>
                {plan.name}
              </h2>
              <div className="mb-2">
                {plan.price ? (
                  <span className={`text-4xl font-display font-semibold ${plan.highlight ? "text-white" : "text-cr-charcoal"}`}>
                    £{plan.price}
                    <span className={`text-sm font-body font-normal ${plan.highlight ? "text-white/60" : "text-cr-slate"}`}>
                      /mo
                    </span>
                  </span>
                ) : (
                  <span className={`text-2xl font-display font-semibold ${plan.highlight ? "text-white" : "text-cr-charcoal"}`}>
                    Custom
                  </span>
                )}
              </div>
              <p className={`text-xs font-body font-medium mb-1 ${plan.highlight ? "text-white/70" : "text-cr-slate"}`}>
                {plan.staff}
              </p>
              <p className={`text-xs font-body mb-5 ${plan.highlight ? "text-white/60" : "text-cr-slate"}`}>
                {plan.desc}
              </p>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle size={14} className={`mt-0.5 flex-shrink-0 ${plan.highlight ? "text-cr-gold" : "text-cr-sage"}`} />
                    <span className={`text-xs font-body ${plan.highlight ? "text-white/80" : "text-cr-charcoal"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.price ? (
                <Link
                  href="/signup"
                  className={`block text-center rounded-lg py-2.5 text-sm font-body font-semibold transition-colors
                    ${plan.highlight
                      ? "bg-white text-cr-forest hover:bg-cr-mint"
                      : "bg-cr-forest text-white hover:bg-cr-sage"
                    }`}
                >
                  {plan.cta}
                </Link>
              ) : (
                <Link
                  href="/demo"
                  className="block text-center rounded-lg py-2.5 text-sm font-body font-semibold border border-cr-forest text-cr-forest hover:bg-cr-mint transition-colors"
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-sm font-body text-cr-slate mt-8">
          All prices exclude VAT. Annual billing available — save 20%.
          <Link href="/demo" className="ml-1 text-cr-forest hover:text-cr-sage transition-colors">
            Talk to us →
          </Link>
        </p>
      </div>
    </div>
  );
}
