/**
 * Database backup script.
 *
 * Local dev:
 *   npx tsx scripts/backup-db.ts
 *   → writes data/backups/app-{timestamp}.db, keeps last 7
 *
 * Production (Turso):
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/backup-db.ts
 *   → calls Turso's built-in dump API and saves the output locally
 *   → schedule this in GitHub Actions or a cron job
 */

import { join } from "node:path";
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { createClient } from "@libsql/client";

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  const BACKUP_DIR = join(process.cwd(), "data", "backups");
  const KEEP = 7;
  mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (tursoUrl && tursoToken) {
    // Turso: use the HTTP dump endpoint to get a SQL dump
    // Turso URL format: libsql://db-name-org.turso.io
    const httpUrl = tursoUrl.replace(/^libsql:\/\//, "https://");
    const dumpUrl = `${httpUrl}/dump`;

    console.log(`Backing up Turso DB: ${tursoUrl}`);
    const res = await fetch(dumpUrl, {
      headers: { Authorization: `Bearer ${tursoToken}` },
    });

    if (!res.ok) {
      throw new Error(`Turso dump failed: ${res.status} ${await res.text()}`);
    }

    const dest = join(BACKUP_DIR, `turso-${timestamp}.sql`);
    writeFileSync(dest, await res.text(), "utf8");
    console.log(`Backup saved to ${dest}`);

    // Prune old Turso backups
    const backups = readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("turso-") && f.endsWith(".sql"))
      .sort()
      .reverse();
    for (const f of backups.slice(KEEP)) {
      unlinkSync(join(BACKUP_DIR, f));
      console.log(`Pruned: ${f}`);
    }
  } else {
    // Local: VACUUM INTO a clean copy
    const DB_PATH = join(process.cwd(), "data", "app.db");
    const dest = join(BACKUP_DIR, `app-${timestamp}.db`);

    const db = createClient({ url: `file:${DB_PATH}` });
    console.log(`Backing up ${DB_PATH} → ${dest}`);
    await db.execute({ sql: "VACUUM INTO ?", args: [dest] });
    console.log("Backup complete.");

    const backups = readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("app-") && f.endsWith(".db"))
      .sort()
      .reverse();
    for (const f of backups.slice(KEEP)) {
      unlinkSync(join(BACKUP_DIR, f));
      console.log(`Pruned: ${f}`);
    }
  }

  console.log(`Kept up to ${KEEP} backup(s) in ${BACKUP_DIR}`);
}

main().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
