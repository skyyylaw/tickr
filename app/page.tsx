import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-tickr-text">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-5xl mx-auto">
        <span
          className="font-serif italic font-bold text-[22px] text-tickr-text"
          style={{ letterSpacing: "-0.02em" }}
        >
          tickr
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] text-tickr-secondary hover:text-tickr-text transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-1.5 bg-tickr-text rounded-[10px] text-[13px] font-medium text-white hover:bg-black/90 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 sm:pt-32 pb-16 sm:pb-24">
        <h1
          className="font-serif italic font-bold text-tickr-text text-4xl sm:text-5xl md:text-6xl leading-tight"
          style={{ letterSpacing: "-0.02em" }}
        >
          tickr
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-tickr-secondary max-w-md">
          Your AI investment analyst
        </p>
        <p className="mt-3 text-[15px] text-tickr-muted max-w-lg leading-relaxed">
          Set your investment thesis. Our AI monitors the market, spots opportunities, and delivers
          personalized trade ideas — so you can focus on what matters.
        </p>
        <Link
          href="/signup"
          className="mt-8 px-8 py-3 bg-tickr-text rounded-[10px] text-[14px] font-medium text-white hover:bg-black/90 transition-colors"
        >
          Get started — it&apos;s free
        </Link>
      </section>

      {/* How it works */}
      <section className="px-6 pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-[13px] font-semibold tracking-widest text-tickr-muted uppercase mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-tickr-bg border border-tickr-border flex items-center justify-center">
                <span className="font-mono text-[14px] font-semibold text-tickr-text">1</span>
              </div>
              <h3 className="text-[15px] font-semibold text-tickr-text mb-2">Set your thesis</h3>
              <p className="text-[13px] text-tickr-secondary leading-relaxed">
                Tell us your goals, risk tolerance, sectors, and strategy. Takes two minutes.
              </p>
            </div>
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-tickr-bg border border-tickr-border flex items-center justify-center">
                <span className="font-mono text-[14px] font-semibold text-tickr-text">2</span>
              </div>
              <h3 className="text-[15px] font-semibold text-tickr-text mb-2">AI monitors markets</h3>
              <p className="text-[13px] text-tickr-secondary leading-relaxed">
                Our agent scans news, earnings, and price action across US stocks — filtered to what matters to you.
              </p>
            </div>
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-tickr-bg border border-tickr-border flex items-center justify-center">
                <span className="font-mono text-[14px] font-semibold text-tickr-text">3</span>
              </div>
              <h3 className="text-[15px] font-semibold text-tickr-text mb-2">Get personalized ideas</h3>
              <p className="text-[13px] text-tickr-secondary leading-relaxed">
                Concise, thesis-aligned trade ideas with cited sources — ready in seconds, not hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-tickr-border px-6 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <span
            className="font-serif italic font-bold text-[16px] text-tickr-muted"
            style={{ letterSpacing: "-0.02em" }}
          >
            tickr
          </span>
          <p className="mt-3 text-[11px] text-tickr-muted leading-relaxed max-w-md mx-auto">
            tickr is a research tool, not a financial advisor. All trade ideas are for informational
            purposes only. Always do your own research before making investment decisions.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-tickr-muted">
            <Link href="/terms" className="hover:text-tickr-secondary transition-colors">
              Terms of Service
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-tickr-secondary transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
