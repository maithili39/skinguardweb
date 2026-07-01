/**
 * Migration runner — applies pending SQL migrations in order.
 *
 * Usage:
 *   npx tsx scripts/migrate.ts                         # local file DB
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/migrate.ts
 */

import { join } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  const db =
    tursoUrl && tursoToken
      ? createClient({ url: tursoUrl, authToken: tursoToken })
      : createClient({ url: `file:${join(process.cwd(), "data", "app.db")}` });

  const target = tursoUrl ? tursoUrl : "local file";
  console.log(`Running migrations against: ${target}\n`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = new Set(
    (await db.execute("SELECT name FROM _migrations ORDER BY id")).rows.map(
      (r) => r.name as string,
    ),
  );

  const MIGRATIONS_DIR = join(process.cwd(), "scripts", "migrations");
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip  ${file}`);
      continue;
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await db.execute(stmt);
    }

    await db.execute({
      sql: "INSERT INTO _migrations (name, applied_at) VALUES (?, ?)",
      args: [file, new Date().toISOString()],
    });

    console.log(`  apply ${file}`);
    ran++;
  }

  console.log(`\nMigrations complete. ${ran} applied, ${applied.size} already up-to-date.`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
