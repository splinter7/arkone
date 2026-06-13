"use client";

import { useState } from "react";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { AppHeader } from "@/components/AppHeader";
import { MediaGallery } from "@/components/MediaGallery";

function AppContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
      <AppHeader
        tagline="Upload images, video, and audio to IPFS. Retrieve signed playback URLs via the API."
        onUploaded={() => setRefreshKey((key) => key + 1)}
      />

      <section className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <MediaGallery refreshKey={refreshKey} />
      </section>
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
