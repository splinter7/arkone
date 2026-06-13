"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PreviewPreloader } from "./PreviewPreloader";

interface ImageLightboxProps {
  url: string;
  name: string;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  url,
  name,
  open,
  onClose,
}: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    setImageReady(false);
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleKeyDown, url]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} full size`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" aria-hidden />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full p-2 text-xl text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white sm:right-6 sm:top-6"
        aria-label="Close lightbox"
      >
        ×
      </button>
      <div
        className="relative z-10 flex max-h-[92vh] max-w-[92vw] items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        {!imageReady && (
          <PreviewPreloader
            compact
            label="Loading image…"
            className="absolute inset-0"
          />
        )}
        <img
          src={url}
          alt={name}
          className={`max-h-[92vh] max-w-[92vw] object-contain transition-opacity duration-300 ${
            imageReady ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageReady(true)}
        />
      </div>
      <p className="absolute bottom-4 left-1/2 z-10 max-w-[90vw] -translate-x-1/2 truncate px-4 text-center text-xs tracking-wide text-white/60 sm:bottom-6">
        {name}
      </p>
    </div>,
    document.body,
  );
}
