"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiKeyGate, useAuth } from "@/components/ApiKeyGate";
import { ArkOneLogo } from "@/components/ArkOneLogo";
import { MediaGallery } from "@/components/MediaGallery";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UploadZone } from "@/components/UploadZone";

function AppContent() {
  const { signOut } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  function handleUploaded() {
    setRefreshKey((key) => key + 1);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
      <header className="animate-fade-in-up space-y-4 border-b border-neutral-200 pb-8 dark:border-neutral-800">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <ArkOneLogo />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Upload images, video, and audio to IPFS. Retrieve signed playback
              URLs via the API.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <ThemeToggle />
            <Link
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-500 underline-offset-4 transition-colors duration-150 hover:underline active:scale-[0.98] dark:text-neutral-400"
            >
              Docs
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="text-sm text-neutral-500 underline-offset-4 transition-colors duration-150 hover:underline active:scale-[0.98] dark:text-neutral-400"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <UploadZone onUploaded={handleUploaded} />
      </div>

      <div
        className="animate-fade-in-up border-t border-neutral-200 pt-12 dark:border-neutral-800"
        style={{ animationDelay: "160ms" }}
      >
        <MediaGallery refreshKey={refreshKey} />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <ApiKeyGate>
      <AppContent />
    </ApiKeyGate>
  );
}
