/** Pointer + press feedback shared by links and buttons */
export const interactiveBase =
  "cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed";

/** Neutral text link (nav, sign out, pagination) */
export const textLinkClass = `${interactiveBase} text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100`;

/** Accent text link (primary actions in nav) */
export const accentLinkClass = `${interactiveBase} text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300`;

/** Inline text action (copy, delete, gallery actions) */
export const actionLinkClass = `${interactiveBase} transition-opacity hover:opacity-70 disabled:cursor-wait disabled:opacity-50`;

/** Icon / ghost control */
export const iconButtonClass = `${interactiveBase} rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:scale-[0.97] dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100`;

/** Sidebar / list nav item */
export const navItemClass = `${interactiveBase} w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-blue-600 active:scale-[0.99] dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-blue-400`;

/** Solid primary button */
export const primaryButtonClass = `${interactiveBase} rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-50 transition-colors hover:bg-neutral-800 active:scale-[0.97] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200`;

/** Logo / brand link */
export const brandLinkClass = `${interactiveBase} inline-block transition-opacity hover:opacity-80 active:scale-[0.99]`;
