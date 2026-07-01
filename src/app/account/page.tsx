import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import LogoutButton from "@/components/logout-button";

export const metadata: Metadata = {
  title: "My Account — SkinGuard",
};

interface SavedItem {
  itemType: string;
  itemId: number;
  createdAt: string;
  label: string;
  href: string;
}

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const savedRes = await db.execute({
    sql: `SELECT si.item_type, si.item_id, si.created_at,
                 COALESCE(p.brand || ' ' || p.name, i.display_name) AS label,
                 CASE si.item_type
                   WHEN 'product' THEN '/products/' || p.slug
                   ELSE '/ingredients/' || i.slug
                 END AS href
          FROM saved_items si
          LEFT JOIN products p ON si.item_type = 'product' AND si.item_id = p.id
          LEFT JOIN ingredients i ON si.item_type = 'ingredient' AND si.item_id = i.id
          WHERE si.user_id = ?
          ORDER BY si.created_at DESC
          LIMIT 50`,
    args: [user.id],
  });

  const saved: SavedItem[] = savedRes.rows.map((r) => ({
    itemType: r.item_type as string,
    itemId: Number(r.item_id),
    createdAt: r.created_at as string,
    label: (r.label as string) ?? "Unknown item",
    href: (r.href as string) ?? "/",
  }));

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-dark">
            My Account
          </h1>
          <p className="mt-1 text-text-muted">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <Link
          href="/analyze"
          className="rounded-2xl border border-border bg-card-bg p-5 hover:shadow-sm"
        >
          <p className="font-display text-base font-semibold text-text-dark">
            Analyze ingredients
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Paste or scan a label for an instant breakdown.
          </p>
        </Link>
        <Link
          href="/products"
          className="rounded-2xl border border-border bg-card-bg p-5 hover:shadow-sm"
        >
          <p className="font-display text-base font-semibold text-text-dark">
            Browse products
          </p>
          <p className="mt-1 text-sm text-text-muted">
            175+ real products, fully analyzed.
          </p>
        </Link>
      </div>

      {/* Saved items */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-text-dark">
          Saved items
        </h2>
        {saved.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card-bg px-6 py-10 text-center text-text-muted">
            <p>You have not saved anything yet.</p>
            <p className="mt-1 text-sm">
              Click the heart icon on any product or ingredient page to save it here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card-bg">
            {saved.map((item) => (
              <li key={`${item.itemType}-${item.itemId}`}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-bg-section"
                >
                  <div>
                    <p className="font-medium text-text-dark">{item.label}</p>
                    <p className="text-xs text-text-muted capitalize">
                      {item.itemType} · Saved{" "}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs text-green-primary">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
