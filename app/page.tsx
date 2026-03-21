import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-tickr-bg px-4">
      <div className="text-center">
        <h1
          className="font-serif italic font-bold text-tickr-text"
          style={{ fontSize: '36px', letterSpacing: '-0.02em' }}
        >
          tickr
        </h1>
        <p className="mt-3 text-[15px] text-tickr-secondary">
          AI-native investment research
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="px-8 py-2.5 bg-tickr-text rounded-[10px] text-[13px] font-medium text-white no-underline hover:bg-black/90 transition-colors"
        >
          Log In
        </Link>
        <Link
          href="/signup"
          className="px-8 py-2.5 bg-transparent border border-tickr-border rounded-[10px] text-[13px] font-medium text-tickr-secondary no-underline hover:border-tickr-secondary transition-colors"
        >
          Sign Up
        </Link>
      </div>
      <p className="text-[11px] text-tickr-muted mt-4">
        AI-generated ideas &middot; not financial advice
      </p>
    </div>
  );
}
