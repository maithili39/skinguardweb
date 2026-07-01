import Link from "next/link";
import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer style={{ backgroundColor: "#1e3828" }}>
      <div className="mx-auto grid max-w-6xl gap-8 px-8 py-10 sm:grid-cols-2 lg:grid-cols-4">

        {/* Column 1 — Brand */}
        <div className="lg:col-span-1">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="SkinGuard"
              width={44}
              height={44}
              className="rounded-xl"
            />
            <span className="font-display text-xl font-bold text-white">
              SkinGuard
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6" style={{ color: "#a8c4b0" }}>
            Free ingredient safety analysis backed by EU CosIng data. No ads.
            No brand influence. Just transparent science.
          </p>
          {/* Social icons */}
          <div className="mt-5 flex gap-3">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-white/60"
              style={{ borderColor: "#3a5a44", color: "#a8c4b0" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-white/60"
              style={{ borderColor: "#3a5a44", color: "#a8c4b0" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2 — Platform */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#a8c4b0" }}>
            Platform
          </p>
          <ul className="mt-4 space-y-3 text-sm" style={{ color: "#c8ddd0" }}>
            <li>
              <Link href="/" className="transition-colors hover:text-white">Home</Link>
            </li>
            <li>
              <Link href="/analyze" className="transition-colors hover:text-white">Analyze</Link>
            </li>
            <li>
              <Link href="/ingredients" className="transition-colors hover:text-white">Ingredients</Link>
            </li>
            <li>
              <Link href="/products" className="transition-colors hover:text-white">Products</Link>
            </li>
          </ul>
        </div>

        {/* Column 3 — Legal */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#a8c4b0" }}>
            Legal
          </p>
          <ul className="mt-4 space-y-3 text-sm" style={{ color: "#c8ddd0" }}>
            <li>
              <Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms" className="transition-colors hover:text-white">Terms of Use</Link>
            </li>
            <li>
              <Link href="/sources" className="transition-colors hover:text-white">Data Sources</Link>
            </li>
            <li>
              <a href="mailto:hello@skinguard.app" className="transition-colors hover:text-white">Contact</a>
            </li>
          </ul>
        </div>

        {/* Column 4 — Stay Updated */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#a8c4b0" }}>
            Stay Updated
          </p>
          <p className="mt-3 text-sm leading-6" style={{ color: "#c8ddd0" }}>
            Join 10,000+ users getting our weekly skincare science digest.
          </p>
          <form action="/api/newsletter" method="post" className="mt-4 flex gap-2">
            <input
              type="email"
              name="email"
              required
              placeholder="Enter your email"
              className="flex-1 min-w-0 rounded-lg px-4 py-2.5 text-sm text-text-dark outline-none focus:ring-2 focus:ring-green-primary"
              style={{ backgroundColor: "#2a4c38", color: "#ffffff", border: "1px solid #3a5a44" }}
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="flex shrink-0 h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-green-btn-hover"
              style={{ backgroundColor: "#5b6e55" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid #2a4c38" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-8 py-3 text-xs sm:flex-row" style={{ color: "#7a9e88" }}>
          <p>&copy; {new Date().getFullYear()} SkinGuard. All rights reserved.</p>
          <p>Ingredient data sourced from the EU CosIng database.</p>
        </div>
      </div>
    </footer>
  );
}
