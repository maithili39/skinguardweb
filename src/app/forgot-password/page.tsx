import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password — SkinGuard",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 font-display text-3xl font-bold text-text-dark">
        Forgot your password?
      </h1>
      <p className="mb-8 text-text-muted">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
