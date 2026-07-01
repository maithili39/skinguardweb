"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <p className="text-sm text-text-muted">
          This reset link is invalid.{" "}
          <Link href="/forgot-password" className="font-medium text-green-primary hover:underline">
            Request a new one
          </Link>
        </p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("done");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("Network error — please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <div className="mb-3 text-3xl">✅</div>
        <h2 className="mb-2 font-semibold text-text-dark">Password updated!</h2>
        <p className="text-sm text-text-muted">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-dark">
          New password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-dark outline-none placeholder:text-text-light focus:border-green-primary"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-text-dark">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-dark outline-none placeholder:text-text-light focus:border-green-primary"
          placeholder="Repeat your new password"
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
        {status === "loading" ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
