import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { verifyApiKey, getBearerToken } from "@/lib/auth";

function makeRequest(auth?: string): NextRequest {
  const headers = new Headers();
  if (auth) headers.set("authorization", auth);
  return new NextRequest("http://localhost/api/test", { headers });
}

describe("auth", () => {
  it("accepts valid bearer token", () => {
    expect(verifyApiKey(makeRequest("Bearer test_secret_key"))).toBe(true);
  });

  it("rejects missing authorization", () => {
    expect(verifyApiKey(makeRequest())).toBe(false);
  });

  it("rejects wrong token", () => {
    expect(verifyApiKey(makeRequest("Bearer wrong"))).toBe(false);
  });

  it("extracts bearer token", () => {
    expect(getBearerToken(makeRequest("Bearer abc"))).toBe("abc");
    expect(getBearerToken(makeRequest())).toBeNull();
  });
});
