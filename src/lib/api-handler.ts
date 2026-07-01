import { NextResponse, type NextRequest } from "next/server";
import { logger } from "./logger";

type Handler = (req: NextRequest, ctx: unknown) => Promise<NextResponse>;

export function withLogger(handler: Handler): Handler {
  return async (req: NextRequest, ctx: unknown) => {
    const start = Date.now();
    const { method, nextUrl } = req;
    const path = nextUrl.pathname;

    try {
      const res = await handler(req, ctx);
      const ms = Date.now() - start;
      logger.info("api", {
        method,
        path,
        status: res.status,
        ms,
      });
      return res;
    } catch (err) {
      const ms = Date.now() - start;
      logger.error("api_error", {
        method,
        path,
        ms,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return NextResponse.json(
        { error: "An unexpected error occurred." },
        { status: 500 },
      );
    }
  };
}
