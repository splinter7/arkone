import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createRequestLogger, logRequestComplete } from "@/lib/logger";
import { getPinataErrorMessage } from "@/lib/pinata-errors";
import {
  getPinata,
  PRESIGNED_UPLOAD_EXPIRES_SEC,
} from "@/lib/pinata";

export async function GET(request: NextRequest) {
  const startMs = Date.now();
  const { log } = createRequestLogger("/api/upload/url", request);

  const authError = requireAuth(request, log);
  if (authError) {
    logRequestComplete(log, 401, startMs);
    return authError;
  }

  try {
    const pinata = getPinata();
    const url = await pinata.upload.public.createSignedURL({
      expires: PRESIGNED_UPLOAD_EXPIRES_SEC,
    });

    log.info({
      event: "upload.url.created",
      expiresSec: PRESIGNED_UPLOAD_EXPIRES_SEC,
    });

    logRequestComplete(log, 200, startMs);
    return NextResponse.json({
      url,
      expiresSec: PRESIGNED_UPLOAD_EXPIRES_SEC,
    });
  } catch (error) {
    log.error({
      event: "upload.failed",
      err: error,
      durationMs: Date.now() - startMs,
    });
    logRequestComplete(log, 500, startMs);
    const message = getPinataErrorMessage(error);
    return NextResponse.json(
      {
        error: "Failed to create upload URL",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
