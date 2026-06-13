import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { findAssetByCid } from "@/lib/assets";
import { createRequestLogger, logRequestComplete } from "@/lib/logger";
import {
  createSignedPlaybackUrl,
  PLAYBACK_URL_EXPIRES_SEC,
} from "@/lib/pinata";
import { generateThumbnailForAsset } from "@/lib/thumbnails";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cid: string }> },
) {
  const startMs = Date.now();
  const { cid } = await context.params;
  const { log } = createRequestLogger("/api/media/[cid]/thumbnail", request);

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

  if (!asset.thumbnailCid) {
    logRequestComplete(log, 404, startMs);
    return NextResponse.json(
      { error: "Thumbnail not available" },
      { status: 404 },
    );
  }

  try {
    const url = await createSignedPlaybackUrl(asset.thumbnailCid);

    log.info({
      event: "media.thumbnail.url.created",
      cid,
      thumbnailCid: asset.thumbnailCid,
      expiresIn: PLAYBACK_URL_EXPIRES_SEC,
    });

    logRequestComplete(log, 200, startMs);
    return NextResponse.json({
      cid: asset.cid,
      thumbnailCid: asset.thumbnailCid,
      url,
      expiresIn: PLAYBACK_URL_EXPIRES_SEC,
    });
  } catch (error) {
    log.error({
      event: "media.thumbnail.url.failed",
      err: error,
      cid,
      durationMs: Date.now() - startMs,
    });
    logRequestComplete(log, 500, startMs);
    return NextResponse.json(
      { error: "Failed to create thumbnail URL" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ cid: string }> },
) {
  const startMs = Date.now();
  const { cid } = await context.params;
  const { log } = createRequestLogger("/api/media/[cid]/thumbnail", request);

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

  let force = false;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      force?: boolean;
    };
    force = body.force === true;
  } catch {
    force = false;
  }

  try {
    const result = await generateThumbnailForAsset(asset, { force });

    if (!result) {
      logRequestComplete(log, 500, startMs);
      return NextResponse.json(
        { error: "Thumbnail generation failed" },
        { status: 500 },
      );
    }

    log.info({
      event: "media.thumbnail.generated",
      cid,
      thumbnailCid: result.thumbnailCid,
      durationMs: Date.now() - startMs,
    });

    logRequestComplete(log, 200, startMs);
    return NextResponse.json({
      cid: asset.cid,
      thumbnailCid: result.thumbnailCid,
      generated: true,
    });
  } catch (error) {
    log.error({
      event: "media.thumbnail.generate.failed",
      err: error,
      cid,
      durationMs: Date.now() - startMs,
    });
    logRequestComplete(log, 500, startMs);
    return NextResponse.json(
      { error: "Thumbnail generation failed" },
      { status: 500 },
    );
  }
}
