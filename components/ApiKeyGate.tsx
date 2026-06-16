"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
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
import { actionLinkClass } from "@/lib/interactive";

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
  const submissionRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = getStoredApiKey();
      if (!stored) {
        if (!cancelled) setReady(true);
        return;
      }

      const normalized = normalizeApiKey(stored);

      try {
        const valid = await validateApiKey(normalized);
        if (cancelled) return;

        if (valid) {
          if (normalized !== stored) {
            storeApiKey(normalized);
          }
          setApiKey(normalized);
        } else {
          sessionStorage.removeItem(API_KEY_STORAGE_KEY);
        }
      } catch {
        if (cancelled) return;
        sessionStorage.removeItem(API_KEY_STORAGE_KEY);
      } finally {
        if (!cancelled) setReady(true);
      }
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
    setError(null);
    submissionRef.current += 1;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeApiKey(input);
    if (!normalized) return;

    const submissionId = ++submissionRef.current;
    setSubmitting(true);
    setError(null);

    try {
      const valid = await validateApiKey(normalized);
      if (submissionId !== submissionRef.current) return;

      if (!valid) {
        sessionStorage.removeItem(API_KEY_STORAGE_KEY);
        setError(
          "Invalid API secret. Use API_SECRET_KEY from .env.local, not PINATA_JWT.",
        );
        return;
      }

      storeApiKey(normalized);
      setApiKey(normalized);
    } catch {
      if (submissionId !== submissionRef.current) return;
      sessionStorage.removeItem(API_KEY_STORAGE_KEY);
      setError(
        "Could not verify API secret. Check your connection and try again.",
      );
    } finally {
      if (submissionId === submissionRef.current) {
        setSubmitting(false);
      }
    }
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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-md animate-fade-in-up space-y-4">
          <div className="flex items-center justify-between gap-4">
            <ArkOneLogo size="sm" />
            <ThemeToggle />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Enter your API secret to upload and retrieve IPFS media.
          </p>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
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
              onChange={(event) => {
                setInput(event.target.value);
                if (error) setError(null);
              }}
              className="border-b border-neutral-300 bg-transparent py-2 text-sm outline-none transition-colors duration-200 focus:border-neutral-900 dark:border-neutral-600 dark:focus:border-neutral-100"
              placeholder="API_SECRET_KEY value"
              autoComplete="off"
            />
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}
            <button
              type="submit"
              className={`py-2 text-sm font-medium ${actionLinkClass} ${
                submitting ? "cursor-wait opacity-50" : ""
              }`}
            >
              {submitting ? "Checking…" : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export function clearStoredApiKey(): void {
  sessionStorage.removeItem(API_KEY_STORAGE_KEY);
}
