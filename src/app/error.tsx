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
    console.error("[error-boundary]", error.message, error.digest);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        fontFamily: "Inter, sans-serif",
        color: "#4a453f",
      }}
    >
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h2>
      <p style={{ color: "#8a8276" }}>An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        style={{
          padding: "0.5rem 1.5rem",
          backgroundColor: "#4a5d44",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "0.95rem",
        }}
      >
        Try again
      </button>
    </div>
  );
}
