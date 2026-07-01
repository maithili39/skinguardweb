import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "@/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password — SkinGuard",
};

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 font-display text-3xl font-bold text-text-dark">
        Set new password
      </h1>
      <p className="mb-8 text-text-muted">
        Choose a new password for your SkinGuard account.
      </p>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
