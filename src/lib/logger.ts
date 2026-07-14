type Level = "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: Level;
  msg: string;
  [key: string]: unknown;
}

const REDACT_KEYS = new Set(["ip", "userId", "email"]);

function redactIp(ip: string): string {
  // Keep the ip useful for coarse rate-limit debugging without logging it
  // in full: 203.0.113.42 -> 203.0.113.x
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts.slice(0, 3).join(".")}.x`;
  return "redacted";
}

function redact(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return meta;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (key === "ip" && typeof value === "string") {
      out[key] = redactIp(value);
    } else if (REDACT_KEYS.has(key)) {
      out[key] = "[redacted]";
    } else {
      out[key] = value;
    }
  }
  return out;
}

function log(level: Level, msg: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...redact(meta),
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
