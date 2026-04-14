import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-tickr-bg text-tickr-text">
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-2xl mx-auto">
        <Link href="/" className="no-underline hover:opacity-80 transition-opacity">
          <span
            className="font-serif italic font-bold text-[22px] text-tickr-text"
            style={{ letterSpacing: "-0.02em" }}
          >
            tickr
          </span>
          <span className="font-serif italic text-[9px] text-tickr-muted" style={{ fontWeight: 400, marginLeft: "2px", position: "relative" as const, top: "5px" }}>
            by sky
          </span>
        </Link>
        <Link href="/login" className="text-sm text-tickr-secondary hover:text-tickr-text transition-colors">
          Back to sign in
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 pb-24 pt-8">
        <h1 className="font-serif text-2xl font-semibold text-tickr-text mb-1">tickr Privacy Policy</h1>
        <p className="text-[13px] text-tickr-muted mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-[14px] text-tickr-secondary leading-relaxed">
          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">What we collect</h2>
            <p>
              <strong className="text-tickr-text">Account information:</strong> your email address and
              password (hashed, we never see your raw password).
            </p>
            <p className="mt-3">
              <strong className="text-tickr-text">Investment profile:</strong> the thesis data you
              provide during onboarding including goals, risk tolerance, sectors, strategies, tickers,
              and your free-text investment thesis.
            </p>
            <p className="mt-3">
              <strong className="text-tickr-text">Usage data:</strong> actions you take within the app
              such as saving ideas, providing feedback, and time spent viewing content. This is used to
              understand what content resonates with you.
            </p>
            <p className="mt-3">
              <strong className="text-tickr-text">Market data queries:</strong> the tickers you search
              for and the watchlist you maintain.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">How we use your data</h2>
            <p>
              All data you provide is used for one purpose: generating personalized investment research
              content for you. Specifically:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>
                Your investment thesis is sent to AI models (Anthropic Claude) to generate trade ideas
                and market briefings tailored to your preferences.
              </li>
              <li>
                Your watchlist tickers are used to fetch relevant market data from financial data
                providers.
              </li>
              <li>
                Your feedback (thumbs up, thumbs down, save, dismiss) is logged to understand content
                quality.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">Third-party services</h2>
            <p>tickr uses the following third-party services to operate:</p>
            <ul className="mt-2 ml-4 list-disc space-y-2">
              <li>
                <strong className="text-tickr-text">Supabase</strong> for authentication and database
                hosting. Your account and profile data is stored here.
              </li>
              <li>
                <strong className="text-tickr-text">Anthropic</strong> for AI-powered content
                generation. Your thesis and relevant market data are sent to their API to generate trade
                ideas and digests. Refer to{" "}
                <a
                  href="https://www.anthropic.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-tickr-text underline hover:opacity-70"
                >
                  Anthropic&apos;s privacy policy
                </a>{" "}
                for how they handle API inputs.
              </li>
              <li>
                <strong className="text-tickr-text">Finnhub</strong> for market data including stock
                quotes, company news, and earnings data.
              </li>
              <li>
                <strong className="text-tickr-text">Tavily</strong> for web search to enrich trade ideas
                with current market context.
              </li>
              <li>
                <strong className="text-tickr-text">Vercel</strong> for application hosting and
                analytics.
              </li>
            </ul>
            <p className="mt-3">
              We do not sell your data to anyone. We do not share your personal information with third
              parties for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">Data storage and security</h2>
            <p>
              Your data is stored in Supabase&apos;s cloud infrastructure with row-level security enforced
              at the database level. Authentication uses industry-standard session management. All
              connections are encrypted via HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">Your rights</h2>
            <p>
              You can export all your data as JSON from your profile page at any time. You can delete
              your account and all associated data from your profile page. Deletion is permanent and
              cascades to all your trade ideas, watchlist items, actions, and history.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">Cookies</h2>
            <p>
              tickr uses cookies solely for authentication session management. We do not use advertising
              or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">Changes</h2>
            <p>
              We may update this policy as the service evolves. Continued use of tickr after changes
              constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-tickr-text mb-2">Contact</h2>
            <p>
              Privacy questions can be directed to{" "}
              <a href="mailto:skyluo@tickr.app" className="text-tickr-text underline hover:opacity-70">
                skyluo@tickr.app
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-tickr-border px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
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
