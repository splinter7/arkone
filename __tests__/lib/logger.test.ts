import { describe, expect, it } from "vitest";
import { sanitizeLogFields } from "@/lib/logger";

describe("logger", () => {
  it("strips sensitive keys from log fields", () => {
    const sanitized = sanitizeLogFields({
      cid: "bafy",
      authorization: "Bearer secret",
      apiKey: "hidden",
      url: "https://gateway.example/files/bafy?sig=abc",
      fileName: "clip.mp4",
    });

    expect(sanitized).toEqual({
      cid: "bafy",
      fileName: "clip.mp4",
    });
  });

  it("creates child logger with route context", async () => {
    const { createRequestLogger } = await import("@/lib/logger");
    const request = new Request("http://localhost/api/upload", {
      method: "POST",
    });

    const { log, requestId } = createRequestLogger("/api/upload", request);
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(log.bindings().route).toBe("/api/upload");
  });
});
