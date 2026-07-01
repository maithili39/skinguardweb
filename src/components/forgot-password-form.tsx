"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("sent");
      }
    } catch {
      setError("Network error — please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <div className="mb-3 text-3xl">📬</div>
        <h2 className="mb-2 font-semibold text-text-dark">Check your inbox</h2>
        <p className="text-sm text-text-muted">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a reset
          link. It expires in 1 hour.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-green-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-dark">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-dark outline-none placeholder:text-text-light focus:border-green-primary"
          placeholder="you@example.com"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-risk-bad-bg px-4 py-3 text-sm text-risk-bad">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-full bg-green-btn px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-text-muted">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-green-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
