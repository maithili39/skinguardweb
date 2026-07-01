import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Playfair_Display } from "next/font/google";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SkinGuard - Skincare Ingredient Analyzer",
  description:
    "Decode skincare ingredient lists instantly. Free analysis backed by EU CosIng data — flag irritants, pore-cloggers, and hidden allergens before you buy.",
};

export const viewport: Viewport = {
  themeColor: "#5b6e55",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  let history: { label: string; verdict: string; createdAt: string }[] = [];
  if (user) {
    try {
      const res = await db.execute({
        sql: "SELECT label, verdict, created_at FROM analysis_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
        args: [user.id],
      });
      history = res.rows.map((r) => ({
        label: r.label as string,
        verdict: r.verdict as string,
        createdAt: r.created_at as string,
      }));
    } catch {
      // table may not exist in local dev without migration
    }
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-page text-text-dark">
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Skip to main content
        </a>
        <SiteHeader user={user} history={history} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
