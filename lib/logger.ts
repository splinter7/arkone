import pino, { type Logger } from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: {
    service: "arkone",
    env: process.env.NODE_ENV ?? "development",
  },
});

const SENSITIVE_KEY_PATTERN =
  /authorization|apikey|api_key|api_secret|pinata_jwt|signedurl|token|^url$/i;

export function sanitizeLogFields(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) continue;
    result[key] = value;
  }

  return result;
}

export function createRequestLogger(route: string, request: Request): {
  log: Logger;
  requestId: string;
} {
  const requestId = crypto.randomUUID();
  const log = logger.child({
    route,
    requestId,
    method: request.method,
  });

  log.info({ event: "request.start" });

  return { log, requestId };
}

export function logRequestComplete(
  log: Logger,
  status: number,
  startMs: number,
): void {
  log.info({
    event: "request.complete",
    status,
    durationMs: Date.now() - startMs,
  });
}
