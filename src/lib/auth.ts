import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { db } from "./db";

const scryptAsync = promisify(scrypt);
const SESSION_COOKIE = "sg_session";
const SESSION_DAYS = 30;
const SALT_BYTES = 32;
const KEY_LEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const key = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  const key = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  const storedBuf = Buffer.from(storedHash, "hex");
  if (key.length !== storedBuf.length) return false;
  return timingSafeEqual(key, storedBuf);
}

function expiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DAYS);
  return d.toISOString();
}

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  await db.execute({
    sql: "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?,?,?,?)",
    args: [token, userId, now, expiresAt()],
  });
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await db.execute({
    sql: "DELETE FROM sessions WHERE token = ?",
    args: [token],
  });
}

export interface SessionUser {
  id: number;
  email: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const now = new Date().toISOString();
  const res = await db.execute({
    sql: `SELECT u.id, u.email
          FROM sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.token = ? AND s.expires_at > ?
          LIMIT 1`,
    args: [token, now],
  });
  if (!res.rows[0]) return null;
  return {
    id: Number(res.rows[0].id),
    email: res.rows[0].email as string,
  };
}

export function sessionCookieValue(token: string): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  const prod = process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Expires=${expires.toUTCString()}`,
  ];
  if (prod) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookieValue(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export async function checkOrigin(): Promise<boolean> {
  const hdrs = await headers();
  const origin = hdrs.get("origin");
  const host = hdrs.get("host");
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return url.host === host;
  } catch {
    return false;
  }
}

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

export async function checkRateLimit(ip: string): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const key = `ip:${ip}`;

  const row = await db.execute({
    sql: "SELECT count, first_at FROM rate_limits WHERE key = ?",
    args: [key],
  });

  const entry = row.rows[0];

  if (!entry || Number(entry.first_at) < windowStart) {
    await db.execute({
      sql: `INSERT INTO rate_limits (key, count, first_at, updated_at)
            VALUES (?, 1, ?, ?)
            ON CONFLICT(key) DO UPDATE SET count = 1, first_at = excluded.first_at, updated_at = excluded.updated_at`,
      args: [key, now, now],
    });
    return true;
  }

  const newCount = Number(entry.count) + 1;
  await db.execute({
    sql: "UPDATE rate_limits SET count = ?, updated_at = ? WHERE key = ?",
    args: [newCount, now, key],
  });

  return newCount <= MAX_ATTEMPTS;
}

export async function getRequestIp(): Promise<string> {
  const hdrs = await headers();
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ??
    hdrs.get("x-real-ip") ??
    "unknown"
  );
}
