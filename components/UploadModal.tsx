"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Asset } from "@/lib/types";
import { iconButtonClass } from "@/lib/interactive";
import { UploadZone } from "./UploadZone";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: (asset: Asset) => void;
}

export function UploadModal({ open, onClose, onUploaded }: UploadModalProps) {
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleClose = useCallback(() => {
    if (uploading) return;
    onClose();
  }, [onClose, uploading]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    },
    [handleClose],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setUploading(false);
      return;
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleKeyDown]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      onClick={handleClose}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2
              id="upload-modal-title"
              className="text-sm font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
            >
              Upload
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Add images, video, or audio to your library.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className={`${iconButtonClass} px-2 py-1 text-xl leading-none text-neutral-400 hover:text-neutral-700 disabled:cursor-wait disabled:opacity-50 dark:hover:text-neutral-200`}
            aria-label="Close upload dialog"
          >
            ×
          </button>
        </div>

        <UploadZone
          onUploaded={onUploaded}
          onUploadingChange={setUploading}
        />
      </div>
    </div>,
    document.body,
  );
}
