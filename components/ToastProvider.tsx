"use client";

import type { CSSProperties } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { iconButtonClass } from "@/lib/interactive";

type ToastVariant = "success" | "error";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4000;
const TOAST_EXIT_MS = 200;

function createToastId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ToastItem({
  toast,
  exiting,
  onDismiss,
  style,
}: {
  toast: Toast;
  exiting: boolean;
  onDismiss: () => void;
  style?: CSSProperties;
}) {
  const isError = toast.variant === "error";

  return (
    <div
      role="status"
      style={style}
      className={`flex min-w-64 max-w-sm items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
        exiting ? "animate-slide-out-right" : "animate-slide-in-right"
      } ${
        isError
          ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          : "border-neutral-200 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      }`}
    >
      <p>{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className={`shrink-0 ${iconButtonClass} text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200`}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const exitingIdsRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const exitTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    const exitTimer = exitTimersRef.current.get(id);
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimersRef.current.delete(id);
    }

    exitingIdsRef.current.delete(id);
    setExitingIds(new Set(exitingIdsRef.current));
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const beginDismiss = useCallback(
    (id: string) => {
      if (exitingIdsRef.current.has(id)) return;

      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }

      exitingIdsRef.current.add(id);
      setExitingIds(new Set(exitingIdsRef.current));

      const exitTimer = setTimeout(() => {
        removeToast(id);
      }, TOAST_EXIT_MS);

      exitTimersRef.current.set(id, exitTimer);
    },
    [removeToast],
  );

  const addToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = createToastId();

      setToasts((current) => [...current, { id, message, variant }]);

      const timer = setTimeout(() => {
        beginDismiss(id);
      }, TOAST_DURATION_MS);

      timersRef.current.set(id, timer);
    },
    [beginDismiss],
  );

  const value = useMemo(
    () => ({
      success: (message: string) => addToast(message, "success"),
      error: (message: string) => addToast(message, "error"),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast, index) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem
              toast={toast}
              exiting={exitingIds.has(toast.id)}
              onDismiss={() => beginDismiss(toast.id)}
              style={{ animationDelay: `${index * 60}ms` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
