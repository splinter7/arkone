import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { readAssets } from "@/lib/assets";
import { createRequestLogger, logRequestComplete } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const startMs = Date.now();
  const { log } = createRequestLogger("/api/media", request);

  const authError = requireAuth(request, log);
  if (authError) {
    logRequestComplete(log, 401, startMs);
    return authError;
  }

  const assets = await readAssets();

  log.info({ event: "media.list", count: assets.length });
  logRequestComplete(log, 200, startMs);

  return NextResponse.json({ assets });
}
