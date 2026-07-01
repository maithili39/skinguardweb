import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AnalysisResults from "@/components/analysis-results";
import type { AnalysisReport } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AnalysisDetailPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");

  const { id } = await params;
  const res = await db.execute({
    sql: "SELECT id, created_at, report_json FROM analysis_history WHERE id = ? AND user_id = ? LIMIT 1",
    args: [Number(id), user.id],
  });

  const row = res.rows[0];
  if (!row || !row.report_json) notFound();

  const report = JSON.parse(row.report_json as string) as AnalysisReport;
  const date = new Date(row.created_at as string).toLocaleDateString(undefined, { dateStyle: "long" });

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/account" className="text-sm text-text-muted hover:text-green-primary transition-colors">
          ← Back
        </Link>
        <span className="text-text-light">·</span>
        <p className="text-sm text-text-muted">{date}</p>
      </div>
      <AnalysisResults report={report} />
    </div>
  );
}
