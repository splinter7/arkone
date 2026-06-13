export const API_KEY_STORAGE_KEY = "arkone_api_key";

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(API_KEY_STORAGE_KEY);
}

export function storeApiKey(key: string): void {
  sessionStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function normalizeApiKey(input: string): string {
  const trimmed = input.trim();
  return trimmed.replace(/^Bearer\s+/i, "");
}

export async function validateApiKey(key: string): Promise<boolean> {
  const response = await fetch("/api/media", {
    headers: { Authorization: `Bearer ${key}` },
  });
  return response.ok;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const apiKey = getStoredApiKey();
  const headers = new Headers(options.headers);

  if (apiKey) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }

  return fetch(path, {
    ...options,
    headers,
  });
}
