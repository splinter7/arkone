import { afterEach, describe, expect, it, vi } from "vitest";
import { validateApiKey } from "@/lib/api-client";

describe("validateApiKey", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("bypasses cached responses so a later valid key can succeed", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => {
      const headers = new Headers(init?.headers);
      const token = headers.get("Authorization");

      if (token === "Bearer wrong-secret") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ assets: [] }), { status: 200 }),
      );
    });

    await expect(validateApiKey("wrong-secret")).resolves.toBe(false);
    await expect(validateApiKey("correct-secret")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("requests media with cache disabled", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ assets: [] }), { status: 200 }),
    );

    await validateApiKey("my-secret");

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/media", {
      method: "GET",
      headers: { Authorization: "Bearer my-secret" },
      cache: "no-store",
    });
  });
});
