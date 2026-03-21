"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[tickr:error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-tickr-bg px-4">
      <span
        className="font-serif italic font-bold text-[22px] text-tickr-text mb-8"
        style={{ letterSpacing: "-0.02em" }}
      >
        tickr
      </span>
      <h1 className="text-4xl font-mono font-bold text-tickr-text">500</h1>
      <p className="mt-3 text-[15px] text-tickr-secondary">
        Something went wrong.
      </p>
      <button
        onClick={reset}
        className="mt-6 px-6 py-2.5 bg-tickr-text rounded-[10px] text-[13px] font-medium text-white hover:bg-black/90 transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
