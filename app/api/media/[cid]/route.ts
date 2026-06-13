import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { findAssetByCid, removeAssetByCid } from "@/lib/assets";
import { createRequestLogger, logRequestComplete } from "@/lib/logger";
import {
  createSignedPlaybackUrl,
  deleteFileFromPinata,
  PLAYBACK_URL_EXPIRES_SEC,
} from "@/lib/pinata";
import { getPinataErrorMessage } from "@/lib/pinata-errors";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cid: string }> },
) {
  const startMs = Date.now();
  const { cid } = await context.params;
  const { log } = createRequestLogger("/api/media/[cid]", request);

  const authError = requireAuth(request, log);
  if (authError) {
    logRequestComplete(log, 401, startMs);
    return authError;
  }

  const asset = await findAssetByCid(cid);

  if (!asset) {
    log.warn({ event: "media.not_found", cid });
    logRequestComplete(log, 404, startMs);
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  try {
    const url = await createSignedPlaybackUrl(cid);

    log.info({
      event: "media.url.created",
      cid,
      category: asset.category,
      expiresIn: PLAYBACK_URL_EXPIRES_SEC,
    });

    logRequestComplete(log, 200, startMs);
    return NextResponse.json({
      cid: asset.cid,
      name: asset.name,
      mimeType: asset.mimeType,
      category: asset.category,
      url,
      expiresIn: PLAYBACK_URL_EXPIRES_SEC,
    });
  } catch (error) {
    log.error({
      event: "upload.failed",
      err: error,
      cid,
      durationMs: Date.now() - startMs,
    });
    logRequestComplete(log, 500, startMs);
    return NextResponse.json(
      { error: "Failed to create playback URL" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ cid: string }> },
) {
  const startMs = Date.now();
  const { cid } = await context.params;
  const { log } = createRequestLogger("/api/media/[cid]", request);

  const authError = requireAuth(request, log);
  if (authError) {
    logRequestComplete(log, 401, startMs);
    return authError;
  }

  const asset = await findAssetByCid(cid);

  if (!asset) {
    log.warn({ event: "media.not_found", cid });
    logRequestComplete(log, 404, startMs);
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  try {
    await deleteFileFromPinata(cid, asset.pinataFileId);

    if (asset.thumbnailCid) {
      await deleteFileFromPinata(
        asset.thumbnailCid,
        asset.thumbnailPinataFileId,
      ).catch((thumbnailDeleteError) => {
        log.warn({
          event: "media.thumbnail.delete.failed",
          cid,
          thumbnailCid: asset.thumbnailCid,
          err: thumbnailDeleteError,
        });
      });
    }
  } catch (error) {
    log.error({
      event: "media.delete.failed",
      err: error,
      cid,
      durationMs: Date.now() - startMs,
    });
    logRequestComplete(log, 500, startMs);
    const message = getPinataErrorMessage(error);
    return NextResponse.json(
      {
        error: "Failed to delete file from Pinata",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }

  await removeAssetByCid(cid);

  log.info({
    event: "media.deleted",
    cid,
    name: asset.name,
    durationMs: Date.now() - startMs,
  });

  logRequestComplete(log, 200, startMs);
  return NextResponse.json({ cid, deleted: true });
}
