"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  API_KEY_STORAGE_KEY,
  getStoredApiKey,
  normalizeApiKey,
  storeApiKey,
  validateApiKey,
} from "@/lib/api-client";
import { ArkOneLogo } from "./ArkOneLogo";
import { ThemeToggle } from "./ThemeToggle";

interface AuthContextValue {
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within ApiKeyGate when authenticated");
  }
  return context;
}

interface ApiKeyGateProps {
  children: React.ReactNode;
}

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-4">
        <div className="h-8 w-32 animate-shimmer rounded" />
        <div className="h-4 w-full animate-shimmer rounded" />
        <div className="h-4 w-3/4 animate-shimmer rounded" />
        <div className="mt-6 h-10 w-full animate-shimmer rounded" />
      </div>
    </div>
  );
}

export function ApiKeyGate({ children }: ApiKeyGateProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = getStoredApiKey();
      if (!stored) {
        if (!cancelled) setReady(true);
        return;
      }

      const normalized = normalizeApiKey(stored);
      if (normalized !== stored) {
        storeApiKey(normalized);
      }

      const valid = await validateApiKey(normalized);
      if (cancelled) return;

      if (valid) {
        setApiKey(normalized);
      } else {
        sessionStorage.removeItem(API_KEY_STORAGE_KEY);
      }
      setReady(true);
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  function signOut() {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(null);
    setInput("");
  }

  if (!ready) {
    return <LoadingSkeleton />;
  }

  if (apiKey) {
    return (
      <AuthContext.Provider value={{ signOut }}>
        <div className="animate-fade-in">{children}</div>
      </AuthContext.Provider>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="absolute right-6 top-6 animate-fade-in">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md animate-fade-in-up space-y-4">
        <ArkOneLogo size="sm" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Enter your API secret to upload and retrieve IPFS media.
        </p>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const normalized = normalizeApiKey(input);
            if (!normalized) return;

            setSubmitting(true);
            setError(null);

            void validateApiKey(normalized).then((valid) => {
              setSubmitting(false);
              if (!valid) {
                setError(
                  "Invalid API secret. Use API_SECRET_KEY from .env.local, not PINATA_JWT.",
                );
                return;
              }
              storeApiKey(normalized);
              setApiKey(normalized);
            });
          }}
        >
          <label
            className="text-sm text-neutral-600 dark:text-neutral-300"
            htmlFor="api-key"
          >
            API secret
          </label>
          <input
            id="api-key"
            type="password"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="border-b border-neutral-300 bg-transparent py-2 text-sm outline-none transition-colors duration-200 focus:border-neutral-900 dark:border-neutral-600 dark:focus:border-neutral-100"
            placeholder="API_SECRET_KEY value"
            autoComplete="off"
            disabled={submitting}
          />
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="py-2 text-sm font-medium underline-offset-4 transition-transform duration-150 hover:underline active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function clearStoredApiKey(): void {
  sessionStorage.removeItem(API_KEY_STORAGE_KEY);
}
