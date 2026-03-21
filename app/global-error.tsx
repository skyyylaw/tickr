"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[tickr:global-error]", error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAFA",
          fontFamily: "system-ui, sans-serif",
          color: "#1a1a1a",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontFamily: "monospace", fontWeight: 700 }}>
          500
        </h1>
        <p style={{ marginTop: "12px", fontSize: "15px", color: "#6b6b6b" }}>
          Something went wrong.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "24px",
            padding: "10px 24px",
            background: "#1a1a1a",
            border: "none",
            borderRadius: "10px",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
