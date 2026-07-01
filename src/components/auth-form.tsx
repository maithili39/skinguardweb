"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        router.push("/account");
        router.refresh();
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-dark">
          Email
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

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-text-dark">
            Password
          </label>
          {isLogin && (
            <Link href="/forgot-password" className="text-xs text-green-primary hover:underline">
              Forgot password?
            </Link>
          )}
        </div>
        <input
          id="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-dark outline-none placeholder:text-text-light focus:border-green-primary"
          placeholder={isLogin ? "Your password" : "At least 8 characters"}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-risk-bad-bg px-4 py-3 text-sm text-risk-bad">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-green-btn px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover disabled:opacity-60"
      >
        {loading
          ? isLogin
            ? "Signing in…"
            : "Creating account…"
          : isLogin
            ? "Sign In"
            : "Create Account"}
      </button>

      <p className="text-center text-sm text-text-muted">
        {isLogin ? (
          <>
            No account?{" "}
            <Link href="/signup" className="font-medium text-green-primary hover:underline">
              Sign up free
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-green-primary hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
