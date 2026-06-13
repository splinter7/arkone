import { afterEach, describe, expect, it } from "vitest";
import { isPinataTlsInsecureEnabled } from "@/lib/ensure-pinata-tls";

describe("ensure-pinata-tls", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalTlsInsecure = process.env.PINATA_TLS_INSECURE;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.PINATA_TLS_INSECURE = originalTlsInsecure;
  });

  it("enables TLS bypass only in development", () => {
    process.env.NODE_ENV = "development";
    process.env.PINATA_TLS_INSECURE = "true";
    expect(isPinataTlsInsecureEnabled()).toBe(true);
  });

  it("ignores TLS bypass in production", () => {
    process.env.NODE_ENV = "production";
    process.env.PINATA_TLS_INSECURE = "true";
    expect(isPinataTlsInsecureEnabled()).toBe(false);
  });

  it("ignores TLS bypass when flag is unset", () => {
    process.env.NODE_ENV = "development";
    delete process.env.PINATA_TLS_INSECURE;
    expect(isPinataTlsInsecureEnabled()).toBe(false);
  });
});
