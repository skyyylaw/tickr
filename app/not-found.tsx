import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-tickr-bg px-4">
      <span className="mb-8">
        <span
          className="font-serif italic font-bold text-[22px] text-tickr-text"
          style={{ letterSpacing: "-0.02em" }}
        >
          tickr
        </span>
        <span className="font-serif italic text-[9px] text-tickr-muted" style={{ fontWeight: 400, marginLeft: "2px", position: "relative", top: "5px" }}>
          by sky
        </span>
      </span>
      <h1 className="text-5xl font-mono font-bold text-tickr-text">404</h1>
      <p className="mt-3 text-[15px] text-tickr-secondary">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-6 px-6 py-2.5 bg-tickr-text rounded-[10px] text-[13px] font-medium text-white hover:bg-black/90 transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
