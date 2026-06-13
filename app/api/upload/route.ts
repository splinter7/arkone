import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { addAsset } from "@/lib/assets";
import { createRequestLogger, logRequestComplete } from "@/lib/logger";
import { getMediaCategory, isAllowedMimeType } from "@/lib/media-types";
import { getPinata } from "@/lib/pinata";
import { getPinataErrorMessage } from "@/lib/pinata-errors";
import { generateThumbnailFromBuffer } from "@/lib/thumbnails";

export async function POST(request: NextRequest) {
  const startMs = Date.now();
  const { log } = createRequestLogger("/api/upload", request);

  const authError = requireAuth(request, log);
  if (authError) {
    logRequestComplete(log, 401, startMs);
    return authError;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      logRequestComplete(log, 400, startMs);
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";

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

    log.info({
      event: "upload.start",
      fileName: file.name,
      mimeType,
      sizeBytes: file.size,
    });

    const pinata = getPinata();
    const upload = await pinata.upload.public.file(file);
    const cid = upload.cid;

    const asset = await addAsset({
      cid,
      name: file.name,
      mimeType,
      category,
      uploadedAt: new Date().toISOString(),
      pinataFileId: upload.id,
    });

    try {
      const sourceBuffer = Buffer.from(await file.arrayBuffer());
      await generateThumbnailFromBuffer(sourceBuffer, asset);
    } catch (thumbnailError) {
      log.warn({
        event: "upload.thumbnail.failed",
        cid,
        err: thumbnailError,
      });
    }

    log.info({
      event: "upload.success",
      cid,
      category,
      durationMs: Date.now() - startMs,
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
    const message = getPinataErrorMessage(error);
    return NextResponse.json(
      {
        error: "Upload failed",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
