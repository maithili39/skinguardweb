import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign In — SkinGuard",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 font-display text-3xl font-bold text-text-dark">
        Sign In
      </h1>
      <p className="mb-8 text-text-muted">
        Welcome back. Sign in to access your saved products and analysis history.
      </p>
      <AuthForm mode="login" />
    </div>
  );
}
