"use client";

import { navItemClass } from "@/lib/interactive";

interface DocsTopic {
  id: string;
  label: string;
}

interface DocsSidebarProps {
  topics: DocsTopic[];
}

function scrollToTopic(id: string) {
  const section = document.getElementById(id);
  if (!section) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  section.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

export function DocsSidebar({ topics }: DocsSidebarProps) {
  return (
    <aside className="sticky top-8 w-full shrink-0 self-start lg:w-52">
      <nav
        aria-label="Documentation topics"
        className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 lg:border-0 lg:bg-transparent lg:p-0 dark:border-neutral-800 dark:bg-neutral-900/50 lg:dark:bg-transparent"
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          Topics
        </p>
        <ul className="space-y-1">
          {topics.map((topic) => (
            <li key={topic.id}>
              <button
                type="button"
                onClick={() => scrollToTopic(topic.id)}
                className={navItemClass}
              >
                {topic.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
