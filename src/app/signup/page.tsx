import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create Account — SkinGuard",
};

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 font-display text-3xl font-bold text-text-dark">
        Create Account
      </h1>
      <p className="mb-8 text-text-muted">
        Free forever. Save products, track your analysis history, and build your
        personalized ingredient watchlist.
      </p>
      <AuthForm mode="signup" />
    </div>
  );
}
