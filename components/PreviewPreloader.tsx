interface PreviewPreloaderProps {
  label?: string;
  className?: string;
  compact?: boolean;
}

export function PreviewPreloader({
  label = "Loading preview…",
  className,
  compact = false,
}: PreviewPreloaderProps) {
  return (
    <div
      className={`flex w-full items-center justify-center ${
        compact
          ? "bg-transparent"
          : "min-h-80 rounded-xl border border-neutral-200/50 bg-neutral-50/40 dark:border-neutral-800/50 dark:bg-neutral-900/20"
      } ${className ?? ""}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600 dark:border-neutral-700 dark:border-t-neutral-200"
          aria-hidden
        />
        <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          {label}
        </p>
      </div>
    </div>
  );
}
