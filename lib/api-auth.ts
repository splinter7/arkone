import { NextRequest, NextResponse } from "next/server";
import type { Logger } from "pino";
import { verifyApiKey } from "./auth";

export function unauthorizedResponse(log: Logger): NextResponse {
  log.warn({ event: "auth.failed", reason: "invalid_or_missing_token" });
  return NextResponse.json(
    { error: "Unauthorized" },
    {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export function requireAuth(
  request: NextRequest,
  log: Logger,
): NextResponse | null {
  if (!verifyApiKey(request)) {
    return unauthorizedResponse(log);
  }
  return null;
}
