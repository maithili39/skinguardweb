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
      <svg width="52" height="52" viewBox="0 0 32 32" fill="none" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="3" width="16" height="20" rx="2" />
        <line x1="10" y1="9" x2="18" y2="9" />
        <line x1="10" y1="13" x2="18" y2="13" />
        <line x1="10" y1="17" x2="14" y2="17" />
        <circle cx="21" cy="22" r="5" fill="rgba(34, 197, 94, 0.1)" stroke="#22c55e" strokeWidth="1.4" />
        <line x1="21" y1="19.5" x2="21" y2="24.5" />
        <line x1="18.5" y1="22" x2="23.5" y2="22" />
      </svg>
    ),
  },
  {
    title: "Trust in data",
    body: "Every analysis is backed by curated dermatological flags and global regulatory databases.",
    icon: (
      <svg width="52" height="52" viewBox="0 0 32 32" fill="none" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3 L28 8 V18 C28 24 22 28 16 30 C10 28 4 24 4 18 V8 Z" />
        <polyline points="11,16 14.5,19.5 21,13" />
      </svg>
    ),
  },
  {
    title: "24K+ Ingredients Analyzed",
    body: "Our database actively tracks over 24,000 cosmetic ingredients with safety data and regulatory status.",
    icon: (
      <svg width="52" height="52" viewBox="0 0 32 32" fill="none" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
    <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
      {/* HERO */}
      <section
        className="relative flex w-full items-center overflow-hidden bg-cover bg-no-repeat"
        style={{
          height: "calc(100vh - 74px)",
          minHeight: "560px",
          maxHeight: "900px",
          backgroundImage: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.7) 50%, rgba(15, 23, 42, 0.85) 100%), url(/skinguard%20main%20page%20image.png)",
          backgroundSize: "cover",
          backgroundPosition: "right center",
        }}
      >
        {/* Animated gradient orbs */}
        <div style={{
          position: "absolute",
          top: "10%",
          right: "10%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "float 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          bottom: "10%",
          left: "5%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "float 10s ease-in-out infinite",
          animationDelay: "2s",
        }} />

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(30px); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-in {
            animation: slideUp 0.8s ease-out;
          }
        `}</style>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-8">
          <div style={{ maxWidth: "550px" }}>
            <div
              className="inline-block rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest backdrop-blur-md"
              style={{
                borderColor: "rgba(34, 197, 94, 0.5)",
                color: "#22c55e",
                backgroundColor: "rgba(34, 197, 94, 0.1)"
              }}
            >
              ✨ AI-Powered Ingredient Analysis
            </div>

            <h1
              className="mt-6 leading-tight tracking-tight animate-in"
              style={{
                fontSize: "clamp(2.8rem, 5vw, 4rem)",
                fontWeight: 900,
                fontFamily: "var(--font-outfit)",
                background: "linear-gradient(135deg, #ffffff 0%, #e0f2fe 50%, #22c55e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.2,
              }}
            >
              Know Every
              <br />
              <span style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic" }}>
                Ingredient
              </span>
              <br />
              Before It Touches Your Skin
            </h1>

            <p className="mt-6 text-base leading-7 animate-in" style={{
              color: "#cbd5e1",
              maxWidth: "450px",
              animationDelay: "0.1s"
            }}>
              Scan, photograph, or paste any ingredient list. Get instant analysis backed by 24,000+ EU CosIng entries and dermatology-backed safety ratings.
            </p>

            <div className="mt-10 flex gap-4 animate-in" style={{ animationDelay: "0.2s" }}>
              <Link
                href="/analyze"
                className="inline-block rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                }}
              >
                Analyze Now
              </Link>
              <Link
                href="/ingredients"
                className="inline-block rounded-2xl px-8 py-4 text-base font-semibold transition-all hover:scale-105 backdrop-blur-md"
                style={{
                  color: "#22c55e",
                  border: "1.5px solid rgba(34, 197, 94, 0.5)",
                  backgroundColor: "rgba(34, 197, 94, 0.05)"
                }}
              >
                Browse Ingredients
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST IN DATA — 3-column bento */}
      <section style={{ background: "linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.5) 100%)" }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-16 text-center">
            <h2
              style={{
                fontSize: "2.8rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Trust in Data
            </h2>
            <p style={{ color: "#cbd5e1", marginTop: "12px", fontSize: "1.1rem" }}>
              Powered by science, backed by regulations
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3" style={{ height: "420px" }}>

            {/* LEFT — gradient card with heading + stat */}
            <div
              className="flex flex-col justify-between rounded-3xl p-10 backdrop-blur-xl border transition-all hover:scale-105 hover:shadow-2xl cursor-pointer"
              style={{
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
                borderColor: "rgba(34, 197, 94, 0.3)",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-playfair)",
                    fontStyle: "italic",
                    fontSize: "2.3rem",
                    fontWeight: 700,
                    color: "#22c55e",
                    lineHeight: 1.25,
                  }}
                >
                  Trust in Data
                </h3>
                <p className="mt-4 text-sm leading-6" style={{ color: "#cbd5e1" }}>
                  Every analysis is backed by curated dermatological flags and global regulatory databases.
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: "4.8rem",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    lineHeight: 1,
                  }}
                >
                  24K<span style={{ fontSize: "2.8rem" }}>+</span>
                </p>
                <p className="mt-2 text-sm font-semibold" style={{ color: "#86efac" }}>
                  EU CosIng Ingredients
                </p>
              </div>
            </div>

            {/* CENTER — serum stats image */}
            <div className="relative overflow-hidden rounded-3xl border transition-all hover:scale-105 hover:shadow-2xl" style={{ borderColor: "rgba(34, 197, 94, 0.2)" }}>
              <Image
                src="/serum-stats.png"
                alt="Serum stability analysis"
                fill
                className="object-cover object-center"
              />
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 100%)",
                pointerEvents: "none"
              }} />
            </div>

            {/* RIGHT — two stacked cards */}
            <div className="flex flex-col gap-6">
              <div
                className="flex flex-1 flex-col justify-center rounded-3xl p-8 backdrop-blur-xl border transition-all hover:scale-105 hover:shadow-2xl cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%)",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                }}
              >
                <p style={{
                  fontSize: "4.5rem",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1,
                }}>
                  275<span style={{ fontSize: "2.6rem" }}>+</span>
                </p>
                <p className="mt-3 text-sm font-semibold" style={{ color: "#bfdbfe" }}>
                  Curated Safety Flags
                </p>
              </div>
              <div
                className="flex flex-1 flex-col justify-center rounded-3xl p-8 backdrop-blur-xl border transition-all hover:scale-105 hover:shadow-2xl cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(196, 181, 253, 0.05) 100%)",
                  borderColor: "rgba(168, 85, 247, 0.3)",
                }}
              >
                <p style={{
                  fontSize: "4.5rem",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #a855f7 0%, #c4b5fd 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1,
                }}>
                  8
                </p>
                <p className="mt-3 text-sm font-semibold" style={{ color: "#ddd6fe" }}>
                  Skin Concern Types
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: "linear-gradient(180deg, rgba(15, 23, 42, 0.5) 0%, rgba(15, 23, 42, 0) 100%)" }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-16 text-center">
            <h2
              className="font-display font-bold"
              style={{
                fontSize: "2.8rem",
                background: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Loved by Skincare Enthusiasts
            </h2>
            <p style={{ color: "#cbd5e1", marginTop: "12px", fontSize: "1.1rem" }}>
              See what our users are discovering
            </p>
          </div>

          <div className="grid items-center gap-16 md:grid-cols-2">
            <div className="flex items-center justify-center">
              <div style={{ position: "relative", width: "420px", height: "420px" }}>
                <Image
                  src="/happy_users_reviews.png"
                  alt="Happy SkinGuard users"
                  width={460}
                  height={460}
                  className="h-auto w-full max-w-[420px] rounded-3xl"
                  style={{
                    boxShadow: "0 20px 60px rgba(34, 197, 94, 0.2)",
                  }}
                />
              </div>
            </div>

            <div className="space-y-6">
              {TESTIMONIALS.map((t, idx) => (
                <div
                  key={t.name}
                  className="rounded-2xl backdrop-blur-xl border p-8 transition-all hover:scale-105 hover:shadow-2xl cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)",
                    borderColor: "rgba(34, 197, 94, 0.2)",
                    animation: `slideUp 0.6s ease-out ${idx * 0.1}s both`,
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontFamily: "Georgia, serif",
                      fontSize: "2.5rem",
                      lineHeight: 1,
                      color: "#22c55e",
                      marginBottom: "12px",
                      opacity: 0.6,
                    }}
                  >
                    &ldquo;
                  </span>
                  <p style={{ color: "#e2e8f0", fontSize: "1rem", lineHeight: "1.8", fontStyle: "italic" }}>
                    {t.quote}
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg"
                      style={{
                        backgroundColor: t.color,
                        boxShadow: `0 8px 24px ${t.color}40`,
                      }}
                    >
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#f0fdfa" }}>{t.name}</p>
                      <div className="flex gap-1 mt-1" style={{ color: "#fbbf24" }}>
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
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
      <section style={{
        background: "linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.8) 100%)"
      }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-16 text-center">
            <h2
              className="font-display font-bold"
              style={{
                fontSize: "2.8rem",
                background: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Backed by Science
            </h2>
            <p className="mt-4" style={{ color: "#cbd5e1", fontSize: "1.1rem" }}>
              Powered by regulatory databases and dermatological research
            </p>
          </div>

          <div className="grid gap-10 text-center md:grid-cols-3">
            {SCIENCE.map((s, idx) => (
              <div
                key={s.title}
                className="flex flex-col items-center rounded-3xl backdrop-blur-xl border p-10 transition-all hover:scale-105 hover:shadow-2xl cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)",
                  borderColor: "rgba(34, 197, 94, 0.2)",
                  animation: `slideUp 0.6s ease-out ${idx * 0.1}s both`,
                }}
              >
                <div
                  className="mb-6 rounded-2xl p-4 transition-all"
                  style={{
                    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
                  }}
                >
                  {/* Update icon stroke color */}
                  {s.icon && typeof s.icon === 'object' && s.icon.type === 'svg' ? (
                    <div style={{ color: "#22c55e" }}>{s.icon}</div>
                  ) : (
                    s.icon
                  )}
                </div>
                <h3
                  className="font-display font-bold"
                  style={{ color: "#f0fdfa", fontSize: "1.3rem" }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-4 leading-7"
                  style={{ color: "#cbd5e1", maxWidth: "280px", fontSize: "0.95rem" }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2
            style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              color: "#f0fdfa",
            }}
          >
            Ready to analyze your products?
          </h2>
          <p style={{ color: "#cbd5e1", marginTop: "16px", fontSize: "1.1rem" }}>
            Join thousands of users making informed skincare decisions
          </p>
          <Link
            href="/analyze"
            className="inline-block mt-8 rounded-2xl px-10 py-4 text-base font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            }}
          >
            Start Analyzing →
          </Link>
        </div>
      </section>
    </div>
  );
}
