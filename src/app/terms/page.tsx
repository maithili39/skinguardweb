import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — SkinGuard",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-text-dark">Terms of Use</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: June 2025</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-text-body">
        <section>
          <h2 className="font-display text-xl font-semibold text-text-dark">Service</h2>
          <p className="mt-3">SkinGuard provides ingredient analysis based on the EU CosIng database and curated safety data. Ingredient information is provided for educational and informational purposes. Always consult a qualified dermatologist or healthcare professional for personal skin health decisions.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-dark">Accounts</h2>
          <p className="mt-3">You are responsible for maintaining the security of your account credentials. You agree not to use the service for any unlawful purpose or to attempt to reverse-engineer, scrape, or copy our database in bulk.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-dark">Accuracy</h2>
          <p className="mt-3">We strive for accuracy but cannot guarantee that every ingredient flag or safety rating is complete or current. EU CosIng data is updated periodically; our curated overlay reflects best available consumer safety research at the time of publication.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-dark">Liability</h2>
          <p className="mt-3">SkinGuard is provided &quot;as is&quot; without warranty of any kind. We are not liable for any loss or damage arising from reliance on analysis results.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-dark">Changes</h2>
          <p className="mt-3">We may update these terms. Continued use of the service after changes constitutes acceptance of the revised terms.</p>
        </section>
      </div>
    </div>
  );
}
