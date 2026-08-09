import Link from "next/link";
import Image from "next/image";

const TESTIMONIALS = [
  {
    quote: "I used to spend 20 minutes googling every ingredient. SkinGuard does it instantly and actually explains what the flag means.",
    name: "Priya R.",
    initial: "P",
    color: "#4a5d44",
  },
  {
    quote: "Found out my 'gentle' cleanser had 3 pore-cloggers. Switched products and my skin finally cleared up.",
    name: "Marcus T.",
    initial: "M",
    color: "#d44c4c",
  },
  {
    quote: "The fungal acne filter is something I've never seen in any other app. This is the tool dermatology Reddit has been asking for.",
    name: "Lena K.",
    initial: "L",
    color: "#4a7fbf",
  },
];

const SCIENCE = [
  {
    title: "Matched against EU data",
    body: "Every ingredient is checked against 24,000+ EU CosIng entries and 275 curated risk flags.",
    icon: (
      <svg width="52" height="52" viewBox="0 0 32 32" fill="none" stroke="#4a5d44" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="3" width="16" height="20" rx="2" />
        <line x1="10" y1="9" x2="18" y2="9" />
        <line x1="10" y1="13" x2="18" y2="13" />
        <line x1="10" y1="17" x2="14" y2="17" />
        <circle cx="21" cy="22" r="5" fill="#f0ede6" stroke="#4a5d44" strokeWidth="1.4" />
        <line x1="21" y1="19.5" x2="21" y2="24.5" />
        <line x1="18.5" y1="22" x2="23.5" y2="22" />
      </svg>
    ),
  },
  {
    title: "Trust in data",
    body: "Every analysis is backed by curated dermatological flags and global regulatory databases.",
    icon: (
      <svg width="52" height="52" viewBox="0 0 32 32" fill="none" stroke="#4a5d44" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3 L28 8 V18 C28 24 22 28 16 30 C10 28 4 24 4 18 V8 Z" />
        <polyline points="11,16 14.5,19.5 21,13" />
      </svg>
    ),
  },
  {
    title: "4000+ Ingredients Analyzed",
    body: "Our database actively tracks over 4,000 common and uncommon skincare ingredients for safety.",
    icon: (
      <svg width="52" height="52" viewBox="0 0 32 32" fill="none" stroke="#4a5d44" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="10" height="10" rx="2" />
        <rect x="18" y="4" width="10" height="10" rx="2" />
        <rect x="4" y="18" width="10" height="10" rx="2" />
        <rect x="18" y="18" width="10" height="10" rx="2" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div style={{ backgroundColor: "#f5f1ea" }}>
      {/* HERO */}
      <section
        className="relative flex w-full items-center overflow-hidden bg-cover bg-no-repeat"
        style={{
          height: "calc(100vh - 74px)",
          minHeight: "560px",
          maxHeight: "900px",
          backgroundImage: "linear-gradient(to right, rgba(245,241,234,0.5) 0%, rgba(245,241,234,0.3) 25%, transparent 60%), url(/skinguard%20main%20page%20image.png)",
          backgroundSize: "cover",
          backgroundPosition: "right center",
          backgroundColor: "#f5f1ea",
        }}
      >

        <div className="mx-auto w-full max-w-6xl px-8">
          <div style={{ maxWidth: "500px" }}>
            <p
              className="inline-block rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ borderColor: "#c8c3bb", color: "#2a2724" }}
            >
              Clean Ingredients
            </p>

            <h1
              className="mt-5 leading-tight tracking-tight text-text-dark"
              style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.5rem)", fontWeight: 900, fontFamily: "var(--font-outfit)" }}
            >
              Good for your skin.
              <br />
              <span style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontWeight: 700, color: "#4a5d44" }}>
                Better for you.
              </span>
            </h1>

            <p className="mt-5 text-base leading-7" style={{ color: "#5a5348", maxWidth: "400px" }}>
              High performance beauty with clean, powerful ingredients that
              truly care. We analyze every label to flag irritants,
              pore-cloggers, and hidden toxins.
            </p>

            <div className="mt-8">
              <Link
                href="/analyze"
                className="inline-block rounded-2xl px-8 py-4 text-base font-semibold text-white shadow transition-colors hover:bg-green-btn-hover"
                style={{ backgroundColor: "#4a5d44" }}
              >
                Analyze Ingredients
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST IN DATA — 3-column bento */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-5 md:grid-cols-3" style={{ height: "420px" }}>

            {/* LEFT — pink card with heading + stat */}
            <div
              className="flex flex-col justify-between rounded-3xl p-9"
              style={{ backgroundColor: "#fce8e0" }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-playfair)",
                    fontStyle: "italic",
                    fontSize: "2.1rem",
                    fontWeight: 700,
                    color: "#c97a55",
                    lineHeight: 1.25,
                  }}
                >
                  Trust in data
                </h2>
                <p className="mt-4 text-sm leading-6" style={{ color: "#7a5a48" }}>
                  Every analysis is backed by curated dermatological flags and global regulatory databases.
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: "4.5rem",
                    fontWeight: 700,
                    color: "#c97a55",
                    lineHeight: 1,
                  }}
                >
                  4000<span style={{ fontSize: "3rem" }}>+</span>
                </p>
                <p className="mt-2 text-sm font-semibold" style={{ color: "#a35e3a" }}>
                  CosIng Ingredients
                </p>
              </div>
            </div>

            {/* CENTER — serum stats image */}
            <div className="relative overflow-hidden rounded-3xl">
              <Image
                src="/serum-stats.png"
                alt="Serum stability analysis"
                fill
                className="object-cover object-center"
              />
            </div>

            {/* RIGHT — two stacked cards */}
            <div className="flex flex-col gap-5">
              <div
                className="flex flex-1 flex-col justify-center rounded-3xl bg-white p-8"
              >
                <p style={{ fontSize: "4rem", fontWeight: 300, color: "#2a2724", lineHeight: 1 }}>
                  275<span style={{ fontSize: "2.4rem" }}>+</span>
                </p>
                <p className="mt-2 text-sm font-medium" style={{ color: "#5a5348" }}>
                  Curated risk flags
                </p>
              </div>
              <div
                className="flex flex-1 flex-col justify-center rounded-3xl p-8"
                style={{ backgroundColor: "#4a5d44" }}
              >
                <p style={{ fontSize: "4rem", fontWeight: 300, color: "#ffffff", lineHeight: 1 }}>
                  8
                </p>
                <p className="mt-2 text-sm font-medium" style={{ color: "#c8ddd0" }}>
                  Routine conflict types
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ backgroundColor: "#edf2ee" }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2
            className="mb-12 text-center font-display font-bold"
            style={{ color: "#1a1a1a", fontSize: "2.5rem" }}
          >
            What users are saying
          </h2>

          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="flex items-center justify-center">
              <Image
                src="/happy_users_reviews.png"
                alt="Happy SkinGuard users"
                width={460}
                height={460}
                className="h-auto w-full max-w-[420px]"
              />
            </div>

            <div className="space-y-4">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="rounded-2xl bg-white p-6"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
                >
                  <span
                    style={{
                      display: "block",
                      fontFamily: "Georgia, serif",
                      fontSize: "2.2rem",
                      lineHeight: 1,
                      color: "#3a5a44",
                      marginBottom: "8px",
                    }}
                  >
                    &ldquo;
                  </span>
                  <p style={{ color: "#4a4540", fontSize: "0.95rem", lineHeight: "1.7", fontStyle: "italic" }}>
                    {t.quote}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{t.name}</p>
                      <div className="flex gap-0.5" style={{ color: "#f0a020" }}>
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BACKED BY SCIENCE */}
      <section style={{ backgroundColor: "#ffffff" }}>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-12 text-center">
            <h2
              className="font-display font-bold"
              style={{ color: "#1a1a1a", fontSize: "2.5rem" }}
            >
              Backed by Science
            </h2>
            <p className="mt-3" style={{ color: "#6a7a6e", fontSize: "1rem" }}>
              We bring transparency to your skincare products.
            </p>
          </div>

          <div className="grid gap-12 text-center md:grid-cols-3">
            {SCIENCE.map((s) => (
              <div key={s.title} className="flex flex-col items-center">
                <div className="mb-6">{s.icon}</div>
                <h3
                  className="font-display font-bold"
                  style={{ color: "#1a1a1a", fontSize: "1.15rem" }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-3 leading-7"
                  style={{ color: "#5a6a5e", maxWidth: "260px", fontSize: "0.95rem" }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
