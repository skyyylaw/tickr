import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-tickr-text">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-3xl mx-auto">
        <Link
          href="/"
          className="font-serif italic font-bold text-[22px] text-tickr-text hover:opacity-80 transition-opacity"
          style={{ letterSpacing: "-0.02em" }}
        >
          tickr
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 pb-24 pt-8">
        <h1 className="text-2xl font-semibold text-tickr-text mb-2">Privacy Policy</h1>
        <p className="text-[13px] text-tickr-muted mb-10">Last updated: April 9, 2026</p>

        <div className="space-y-8 text-[14px] text-tickr-secondary leading-relaxed">
          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">1. Overview</h2>
            <p>
              tickr (&quot;we,&quot; &quot;our,&quot; or &quot;the Service&quot;) is committed to protecting your privacy. This
              Privacy Policy explains what information we collect, how we use it, and your rights
              regarding your data. By using tickr, you agree to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">2. Information We Collect</h2>
            <p className="font-medium text-tickr-text">Account Information</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>
                <strong>Email address</strong> — used to create and identify your account, and to
                communicate with you about the Service.
              </li>
              <li>
                <strong>Password</strong> — your password is hashed and managed by Supabase Auth.
                We never have access to your plaintext password.
              </li>
            </ul>

            <p className="font-medium text-tickr-text mt-4">Investment Thesis & Preferences</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Investment goals, risk tolerance, and time horizon</li>
              <li>Sectors, industries, and investment strategies you select</li>
              <li>Stock tickers you add to your watchlist and positions</li>
              <li>Experience level and investment constraints</li>
            </ul>

            <p className="font-medium text-tickr-text mt-4">Interaction Data</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Ideas you save, dismiss, or mark with thumbs up/down</li>
              <li>Feedback reasons you provide for dismissed ideas</li>
              <li>Cards you view or expand</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">3. How We Use Your Data</h2>
            <p>We use your data to:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Generate personalized, thesis-aligned trade ideas and market summaries</li>
              <li>Improve the relevance and quality of AI-generated recommendations over time</li>
              <li>Maintain your account and provide the core Service functionality</li>
              <li>Analyze how features are used to improve the product</li>
              <li>Communicate important updates about the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">4. AI Processing — Anthropic Claude</h2>
            <p>
              tickr uses Anthropic&apos;s Claude API to generate trade ideas, earnings digests, and daily
              market briefings. To do this, your investment thesis (goals, risk profile, sectors,
              strategies, watchlist tickers) and relevant market data (news articles, price data,
              earnings information) are sent to Anthropic&apos;s API for processing.
            </p>
            <p className="mt-3">
              We do not send your email address or password to Anthropic. Data sent to Anthropic is
              used solely to generate your personalized content and is subject to{" "}
              <a
                href="https://www.anthropic.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tickr-text underline hover:opacity-70"
              >
                Anthropic&apos;s Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">5. Data Storage</h2>
            <p>
              Your data is stored on Supabase, a managed database platform hosted on Amazon Web
              Services (AWS). All data is encrypted at rest and in transit. Access to your data is
              restricted to authenticated requests using row-level security policies — only you can
              access your own data.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">6. Third-Party Services</h2>
            <p>We integrate with the following third-party services to operate tickr:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>
                <strong>Supabase</strong> — database and authentication (hosted on AWS)
              </li>
              <li>
                <strong>Anthropic Claude</strong> — AI-generated trade ideas and market analysis
              </li>
              <li>
                <strong>Finnhub</strong> — real-time market data and financial news
              </li>
              <li>
                <strong>Tavily</strong> — web search for additional market context
              </li>
              <li>
                <strong>Vercel</strong> — application hosting and deployment
              </li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data to any third party, including advertisers or data
              brokers. We share data with the above providers only to the extent necessary to provide
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">7. Your Rights & Data Controls</h2>
            <p>You have the following rights regarding your data:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>
                <strong>Export</strong> — download a copy of all your data from the Profile page
              </li>
              <li>
                <strong>Delete</strong> — permanently delete your account and all associated data
                from the Profile page. Deletion is immediate and irreversible.
              </li>
              <li>
                <strong>Correct</strong> — update your investment thesis and profile at any time
                from the Profile page
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">8. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. When you delete your account,
              we permanently delete your profile, watchlist, trade ideas, and interaction history.
              Some anonymized, aggregated data may be retained for product improvement purposes.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">9. Cookies & Tracking</h2>
            <p>
              tickr uses session cookies managed by Supabase Auth to keep you logged in. We do not
              use tracking cookies, advertising pixels, or third-party analytics that follow you
              across websites.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">10. Children&apos;s Privacy</h2>
            <p>
              tickr is not intended for users under 18 years of age. We do not knowingly collect
              personal information from minors. If you believe a minor has created an account, please
              contact us and we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes via email or in-app notice. Continued use of the Service after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-tickr-border px-6 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 text-[12px] text-tickr-muted">
            <Link href="/" className="hover:text-tickr-secondary transition-colors">Home</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-tickr-secondary transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-tickr-secondary transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
