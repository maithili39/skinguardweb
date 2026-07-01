"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setState("success");
        setEmail("");
      } else {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="mt-4 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#2a4c38", color: "#a8e6b8" }}>
        You&apos;re in! Check your inbox for a welcome email.
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="email"
          required
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "loading"}
          className="flex-1 min-w-0 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-primary"
          style={{ backgroundColor: "#2a4c38", color: "#ffffff", border: "1px solid #3a5a44" }}
        />
        <button
          type="submit"
          aria-label="Subscribe"
          disabled={state === "loading"}
          className="flex shrink-0 h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-green-btn-hover disabled:opacity-60"
          style={{ backgroundColor: "#5b6e55" }}
        >
          {state === "loading" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </form>
      {state === "error" && (
        <p className="mt-2 text-xs" style={{ color: "#f87171" }}>{errorMsg}</p>
      )}
    </>
  );
}
