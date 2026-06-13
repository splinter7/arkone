export function isPinataTlsInsecureEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.PINATA_TLS_INSECURE === "true"
  );
}

if (isPinataTlsInsecureEnabled()) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
} else if (
  process.env.NODE_ENV === "production" &&
  process.env.PINATA_TLS_INSECURE === "true"
) {
  console.warn("[arkone] PINATA_TLS_INSECURE is ignored in production.");
}
