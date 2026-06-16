export default function CookiesPage() {
  return (
    <main className="bg-cr-ivory min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <span className="inline-block text-xs font-body font-semibold uppercase tracking-widest text-cr-forest bg-cr-mint px-3 py-1.5 rounded-full mb-5">Legal</span>
        <h1 className="font-display text-5xl text-cr-charcoal mb-3">Cookie Policy</h1>
        <p className="text-sm text-cr-slate font-body mb-10">Last updated: June 2026</p>

        <div className="prose prose-sm max-w-none font-body text-cr-charcoal space-y-8">
          <section>
            <h2 className="font-body font-semibold text-lg text-cr-charcoal mb-2">What are cookies?</h2>
            <p className="text-cr-slate leading-relaxed">Cookies are small text files placed on your device when you visit a website. Careroot uses cookies to operate the platform securely and to improve your experience.</p>
          </section>
          <section>
            <h2 className="font-body font-semibold text-lg text-cr-charcoal mb-2">Cookies we use</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cr-mint"><tr>{["Cookie", "Purpose", "Duration"].map((h) => <th key={h} className="px-4 py-2.5 text-left font-semibold text-cr-slate text-xs uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ["sb-session", "Supabase authentication session", "Session"],
                    ["sb-refresh-token", "Keeps you logged in", "30 days"],
                    ["_vercel_analytics", "Anonymous usage analytics (Vercel)", "30 days"],
                  ].map(([name, purpose, duration]) => (
                    <tr key={name}><td className="px-4 py-3 font-mono text-xs text-cr-charcoal">{name}</td><td className="px-4 py-3 text-cr-slate">{purpose}</td><td className="px-4 py-3 text-cr-slate">{duration}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h2 className="font-body font-semibold text-lg text-cr-charcoal mb-2">Essential cookies</h2>
            <p className="text-cr-slate leading-relaxed">Authentication cookies are strictly necessary for Careroot to function and cannot be disabled. They allow you to stay logged in and keep your session secure.</p>
          </section>
          <section>
            <h2 className="font-body font-semibold text-lg text-cr-charcoal mb-2">Analytics cookies</h2>
            <p className="text-cr-slate leading-relaxed">We use Vercel Analytics to understand how the platform is used. This data is anonymous and does not identify individuals.</p>
          </section>
          <section>
            <h2 className="font-body font-semibold text-lg text-cr-charcoal mb-2">Managing cookies</h2>
            <p className="text-cr-slate leading-relaxed">You can disable cookies in your browser settings. Disabling authentication cookies will prevent you from logging in to Careroot.</p>
          </section>
          <section>
            <h2 className="font-body font-semibold text-lg text-cr-charcoal mb-2">Contact</h2>
            <p className="text-cr-slate leading-relaxed">Questions about our cookie usage? Email us at <a href="mailto:onboarding@careroot.co.uk" className="text-cr-forest underline">onboarding@careroot.co.uk</a>.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
