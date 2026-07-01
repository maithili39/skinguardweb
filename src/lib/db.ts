import "server-only";
import { join } from "node:path";
import { createClient, type Client } from "@libsql/client";

declare global {
  var __skinguardDb: Client | undefined;
}

function create(): Client {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  const client =
    tursoUrl && tursoToken
      ? // Production: Turso cloud SQLite
        createClient({ url: tursoUrl, authToken: tursoToken })
      : // Development: local file
        createClient({ url: `file:${join(process.cwd(), "data", "app.db")}` });

  // Integrity check on first connect — surfaces DB corruption in logs before
  // queries start failing.
  client
    .execute("PRAGMA integrity_check")
    .then((res) => {
      const result = res.rows[0]?.[0];
      if (result !== "ok") {
        console.error(
          JSON.stringify({
            ts: new Date().toISOString(),
            level: "error",
            msg: "db_integrity_check_failed",
            result,
          }),
        );
      }
    })
    .catch((err) => {
      // Turso cloud doesn't support PRAGMA — safe to ignore
      if (!String(err).includes("PRAGMA")) {
        console.error(
          JSON.stringify({
            ts: new Date().toISOString(),
            level: "error",
            msg: "db_integrity_check_error",
            error: String(err),
          }),
        );
      }
    });

  return client;
}

export const db: Client = global.__skinguardDb ?? create();
if (process.env.NODE_ENV !== "production") {
  global.__skinguardDb = db;
}

void db.execute(`
  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    email      TEXT PRIMARY KEY,
    created_at TEXT NOT NULL
  )
`);
