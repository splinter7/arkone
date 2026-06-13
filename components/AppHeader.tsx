"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./ApiKeyGate";
import { ArkOneLogo } from "./ArkOneLogo";
import { ThemeToggle } from "./ThemeToggle";
import { UploadModal } from "./UploadModal";

const menuLinkClass =
  "text-sm text-neutral-500 underline-offset-4 transition-colors duration-150 hover:underline active:scale-[0.98] dark:text-neutral-400";

const uploadLinkClass =
  "text-sm text-blue-600 underline-offset-4 transition-colors duration-150 hover:text-blue-700 hover:underline active:scale-[0.98] dark:text-blue-400 dark:hover:text-blue-300";

function navLinkClass(isActive: boolean) {
  return isActive
    ? `${menuLinkClass} font-medium text-neutral-900 underline dark:text-neutral-100`
    : menuLinkClass;
}

interface AppHeaderProps {
  tagline: string;
  onUploaded?: () => void;
}

export function AppHeader({ tagline, onUploaded }: AppHeaderProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const showUpload = pathname !== "/docs";

  function handleUploaded() {
    onUploaded?.();
    setUploadOpen(false);
  }

  return (
    <>
      <header className="animate-fade-in-up space-y-4 border-b border-neutral-200 pb-8 dark:border-neutral-800">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/"
              className="inline-block transition-opacity duration-150 hover:opacity-80 active:scale-[0.99]"
              aria-label="ArkOne home"
            >
              <ArkOneLogo />
            </Link>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {tagline}
            </p>
          </div>
          <nav
            className="flex shrink-0 items-center gap-4"
            aria-label="Main navigation"
          >
            {showUpload && (
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className={uploadLinkClass}
              >
                Upload
              </button>
            )}
            <Link href="/docs" className={navLinkClass(pathname === "/docs")}>
              Docs
            </Link>
            <button type="button" onClick={signOut} className={menuLinkClass}>
              Sign out
            </button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {showUpload && (
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUploaded={handleUploaded}
        />
      )}
    </>
  );
}
