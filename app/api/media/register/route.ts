import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { addAsset } from "@/lib/assets";
import { createRequestLogger, logRequestComplete } from "@/lib/logger";
import { getMediaCategory, isAllowedMimeType } from "@/lib/media-types";
import { generateThumbnailForAsset } from "@/lib/thumbnails";

export async function POST(request: NextRequest) {
  const startMs = Date.now();
  const { log } = createRequestLogger("/api/media/register", request);

  const authError = requireAuth(request, log);
  if (authError) {
    logRequestComplete(log, 401, startMs);
    return authError;
  }

  try {
    const body = (await request.json()) as {
      cid?: string;
      name?: string;
      mimeType?: string;
      pinataFileId?: string;
    };

    const { cid, name, mimeType, pinataFileId } = body;

    if (!cid || !name || !mimeType) {
      logRequestComplete(log, 400, startMs);
      return NextResponse.json(
        { error: "cid, name, and mimeType are required" },
        { status: 400 },
      );
    }

    if (!isAllowedMimeType(mimeType)) {
      logRequestComplete(log, 400, startMs);
      return NextResponse.json(
        { error: "Unsupported media type" },
        { status: 400 },
      );
    }

    const category = getMediaCategory(mimeType);
    if (!category) {
      logRequestComplete(log, 400, startMs);
      return NextResponse.json(
        { error: "Unsupported media type" },
        { status: 400 },
      );
    }

    const asset = await addAsset({
      cid,
      name,
      mimeType,
      category,
      uploadedAt: new Date().toISOString(),
      pinataFileId,
    });

    log.info({
      event: "media.register",
      cid: asset.cid,
      name: asset.name,
      mimeType: asset.mimeType,
    });

    void generateThumbnailForAsset(asset).catch((thumbnailError) => {
      log.warn({
        event: "media.register.thumbnail.failed",
        cid: asset.cid,
        err: thumbnailError,
      });
    });

    logRequestComplete(log, 200, startMs);
    return NextResponse.json({
      cid: asset.cid,
      name: asset.name,
      mimeType: asset.mimeType,
      category: asset.category,
    });
  } catch (error) {
    log.error({
      event: "upload.failed",
      err: error,
      durationMs: Date.now() - startMs,
    });
    logRequestComplete(log, 500, startMs);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
