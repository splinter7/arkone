"use client";

import { useCallback, useEffect, useState } from "react";
import { iconButtonClass } from "@/lib/interactive";
import { scrollToTop } from "@/lib/motion";

const SCROLL_THRESHOLD_PX = 300;

function ChevronUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  const updateVisibility = useCallback(() => {
    setVisible(window.scrollY > SCROLL_THRESHOLD_PX);
  }, []);

  useEffect(() => {
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, [updateVisibility]);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`${iconButtonClass} fixed bottom-10 right-6 z-40 border border-neutral-200 bg-white shadow-md transition-all duration-300 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-neutral-950/50 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <ChevronUpIcon />
    </button>
  );
}
