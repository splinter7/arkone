import { textLinkClass } from "@/lib/interactive";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalItems <= pageSize) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <nav
      aria-label="Pagination"
      className="animate-fade-in flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800"
    >
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Showing {start}–{end} of {totalItems}
      </p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`${textLinkClass} disabled:text-neutral-400 dark:disabled:text-neutral-600`}
        >
          Previous
        </button>

        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`${textLinkClass} disabled:text-neutral-400 dark:disabled:text-neutral-600`}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
