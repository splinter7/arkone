"use client";

import { useTheme } from "./ThemeProvider";
import { iconButtonClass } from "@/lib/interactive";

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" stroke="none" />
      <path
        fill="none"
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="10.2" cy="10.4" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="13.6" cy="9.2" r="0.55" fill="currentColor" stroke="none" />
      <circle cx="14.1" cy="13.1" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="9.4" cy="13.6" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="11.8" cy="15.2" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="12.8" cy="11.5" r="0.35" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={iconButtonClass}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
