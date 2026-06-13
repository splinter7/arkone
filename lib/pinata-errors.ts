export function getPinataErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause = error as Error & { cause?: { code?: string } };
    if (cause.cause?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
      return "TLS certificate verification failed. Set PINATA_TLS_INSECURE=true in .env.local for local dev on Windows, or fix Node.js CA certificates.";
    }
    if (error.message.includes("fetch failed")) {
      return "Could not reach Pinata. Check network connectivity and TLS settings.";
    }
    return error.message;
  }

  return "Unknown error";
}
