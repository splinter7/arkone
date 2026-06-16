"use client";

import { useCallback, useRef, useState } from "react";
import type { MediaCategory } from "@/lib/media-types";
import { ImageLightbox } from "./ImageLightbox";
import { PreviewPreloader } from "./PreviewPreloader";

interface MediaPlayerProps {
  url: string;
  category: MediaCategory;
  name: string;
  onUrlExpired?: () => void;
}

const mediaClassName =
  "block max-h-80 max-w-full object-contain transition-opacity duration-300";

const loadedFrameClassName =
  "overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-50/40 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/30";

export function MediaPlayer({
  url,
  category,
  name,
  onUrlExpired,
}: MediaPlayerProps) {
  const retriedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleError = useCallback(() => {
    if (retriedRef.current || !onUrlExpired) return;
    retriedRef.current = true;
    onUrlExpired();
  }, [onUrlExpired]);

  const handleReady = useCallback(() => {
    setReady(true);
  }, []);

  return (
    <div
      className={`relative flex w-full justify-center transition-[min-height] duration-300 ease-out ${
        ready ? "min-h-0" : "min-h-80"
      }`}
    >
      {!ready && <PreviewPreloader className="absolute inset-0" />}
      {category === "image" && (
        <>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            disabled={!ready}
            className={`group relative text-left transition-opacity duration-300 ${
              ready
                ? `cursor-zoom-in opacity-100 ${loadedFrameClassName}`
                : "pointer-events-none absolute inset-0 opacity-0"
            }`}
            aria-label={`Open ${name} in lightbox`}
          >
            <img
              src={url}
              alt={name}
              className={mediaClassName}
              onLoad={handleReady}
              onError={handleError}
            />
            {ready && (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 text-xs text-white/90 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                View full size
              </span>
            )}
          </button>
          <ImageLightbox
            url={url}
            name={name}
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        </>
      )}
      {category === "video" && (
        <video
          src={url}
          controls
          className={`max-h-80 max-w-full transition-opacity duration-300 ${
            ready
              ? `opacity-100 ${loadedFrameClassName}`
              : "pointer-events-none absolute inset-0 h-full w-full opacity-0"
          }`}
          preload="metadata"
          onLoadedData={handleReady}
          onError={handleError}
        />
      )}
      {category === "audio" && (
        <div
          className={`w-full max-w-md transition-opacity duration-300 ${
            ready
              ? `opacity-100 ${loadedFrameClassName} px-4 py-5`
              : "pointer-events-none absolute inset-0 flex items-center opacity-0"
          }`}
        >
          <audio
            src={url}
            controls
            className="w-full"
            preload="metadata"
            onCanPlay={handleReady}
            onError={handleError}
          />
        </div>
      )}
    </div>
  );
}
