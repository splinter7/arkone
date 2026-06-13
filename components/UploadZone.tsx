"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, getStoredApiKey } from "@/lib/api-client";
import {
  isAllowedMimeType,
  shouldUsePresignedUpload,
} from "@/lib/media-types";
import type { Asset } from "@/lib/types";
import { xhrUpload } from "@/lib/upload-with-progress";
import { useToast } from "./ToastProvider";

interface UploadZoneProps {
  onUploaded: (asset: Asset) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

function parseUploadResponse(body: string): Asset {
  const data = JSON.parse(body) as {
    cid: string;
    name: string;
    mimeType: string;
    category: Asset["category"];
  };

  return {
    cid: data.cid,
    name: data.name,
    mimeType: data.mimeType,
    category: data.category,
    uploadedAt: new Date().toISOString(),
  };
}

async function uploadViaServer(
  file: File,
  onProgress: (percent: number) => void,
): Promise<Asset> {
  const formData = new FormData();
  formData.append("file", file);

  const apiKey = getStoredApiKey();
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const result = await xhrUpload("/api/upload", formData, headers, onProgress);

  if (!result.ok) {
    const body = JSON.parse(result.body || "{}") as { error?: string };
    throw new Error(body.error ?? "Upload failed");
  }

  return parseUploadResponse(result.body);
}

async function uploadViaPresignedUrl(
  file: File,
  onProgress: (percent: number) => void,
  onStatus: (status: string) => void,
): Promise<Asset> {
  onStatus("Getting upload URL…");
  const urlResponse = await apiFetch("/api/upload/url");
  if (!urlResponse.ok) {
    const body = await urlResponse.json().catch(() => ({}));
    throw new Error(
      (body as { detail?: string; error?: string }).detail ??
        (body as { error?: string }).error ??
        "Failed to get upload URL",
    );
  }

  const { url } = (await urlResponse.json()) as { url: string };

  const formData = new FormData();
  formData.append("file", file);
  formData.append("network", "public");

  onStatus(`Uploading ${file.name}…`);
  const uploadResult = await xhrUpload(url, formData, {}, onProgress);

  if (!uploadResult.ok) {
    throw new Error("Direct upload failed");
  }

  const uploadBody = JSON.parse(uploadResult.body) as {
    data?: { cid?: string; id?: string };
    id?: string;
    cid?: string;
    IpfsHash?: string;
  };

  const cid =
    uploadBody?.data?.cid ?? uploadBody?.cid ?? uploadBody?.IpfsHash;
  const pinataFileId = uploadBody?.data?.id ?? uploadBody?.id;

  if (!cid) {
    throw new Error("Upload succeeded but CID was missing");
  }

  onStatus("Registering asset…");
  onProgress(100);

  const registerResponse = await apiFetch("/api/media/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cid,
      name: file.name,
      mimeType: file.type,
      pinataFileId,
    }),
  });

  if (!registerResponse.ok) {
    const body = await registerResponse.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? "Failed to register asset",
    );
  }

  const data = await registerResponse.json();
  return {
    cid: data.cid,
    name: data.name,
    mimeType: data.mimeType,
    category: data.category,
    uploadedAt: new Date().toISOString(),
  };
}

export function UploadZone({ onUploaded, onUploadingChange }: UploadZoneProps) {
  const toast = useToast();
  const [dragging, setDragging] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const handleFile = useCallback(
    async (file: File) => {
      setUploadPhase(null);
      setProgress(null);

      if (!isAllowedMimeType(file.type)) {
        toast.error("Only image, video, and audio files are supported.");
        return;
      }

      setUploading(true);
      setUploadPhase(`Uploading ${file.name}…`);
      setProgress(0);

      try {
        const usePresigned = shouldUsePresignedUpload(file.type, file.size);
        const asset = usePresigned
          ? await uploadViaPresignedUrl(file, setProgress, setUploadPhase)
          : await uploadViaServer(file, setProgress);

        onUploaded(asset);
        setProgress(100);
        setUploadPhase(null);
        toast.success(`${asset.name} uploaded`);
      } catch (uploadError) {
        setUploadPhase(null);
        toast.error(
          uploadError instanceof Error
            ? uploadError.message
            : "Upload failed",
        );
      } finally {
        setUploading(false);
      }
    },
    [onUploaded, toast],
  );

  return (
    <div className="space-y-4">
      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-all duration-300 ease-out ${
          dragging
            ? "scale-[1.01] border-neutral-900 bg-neutral-100 ring-4 ring-neutral-900/5 dark:border-neutral-100 dark:bg-neutral-900 dark:ring-neutral-100/10"
            : "border-neutral-300 bg-white shadow-sm hover:border-neutral-400 hover:bg-neutral-100/80 dark:border-neutral-700 dark:bg-neutral-950/50 dark:shadow-none dark:hover:border-neutral-600 dark:hover:bg-neutral-950/70"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <div className="mx-auto flex max-w-sm flex-col items-center gap-5">
          <div className="space-y-1">
            <p className="text-base font-medium text-neutral-900 transition-opacity duration-200 dark:text-neutral-100">
              {dragging ? "Drop to upload" : "Drop media here"}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Images, video, and audio files
            </p>
          </div>
          <label className="cursor-pointer rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-50 transition-all duration-150 hover:bg-neutral-800 active:scale-[0.97] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200">
            Choose file
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {uploading && progress !== null && (
        <div
          className="animate-fade-in-up space-y-1 rounded-xl bg-white px-4 py-3 dark:bg-neutral-950/50"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
        >
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-neutral-900 transition-[width] duration-300 ease-out dark:bg-neutral-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {uploadPhase ?? `${progress}%`}
          </p>
        </div>
      )}
    </div>
  );
}
