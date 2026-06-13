export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/ensure-pinata-tls");
  }
}
