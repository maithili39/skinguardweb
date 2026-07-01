import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — SkinGuard",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-text-dark">Privacy Policy</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: June 2025</p>

      <div className="prose mt-10 space-y-8 text-sm leading-7 text-text-body">
        <section>
          <h2 className="font-display text-xl font-semibold text-text-dark">What we collect</h2>
          <p className="mt-3">When you create an account, we store your email address and a salted, hashed version of your password. We never store your password in plain text. Session tokens are stored server-side and transmitted only via secure, httpOnly cookies.</p>
          <p className="mt-3">Ingredient lists you analyze are processed in real time and are not stored unless you explicitly save them to your account.</p>
          <p className="mt-3">Photos you upload for OCR are processed entirely inside your browser using WebAssembly. The image never leaves your device or reaches our servers.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-dark">How we use it</h2>
          <p className="mt-3">Your email is used solely to identify your account and send you opt-in communications you explicitly request. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-dark">Cookies</h2>
          <p className="mt-3">We set one httpOnly session cookie when you sign in. It is used only to authenticate requests and is deleted when you sign out. We do not use advertising cookies or third-party tracking.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-dark">Data retention</h2>
          <p className="mt-3">Your account and saved items remain until you delete your account. Sessions expire after 30 days of inactivity. You may request deletion of all your data by contacting us.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-dark">Contact</h2>
          <p className="mt-3">Questions? Email us at <a href="mailto:hello@skinguard.app" className="text-green-primary hover:underline">hello@skinguard.app</a>.</p>
        </section>
      </div>
    </div>
  );
}
