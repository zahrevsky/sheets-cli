import type { SheetsLimits } from "./limits";

function isRetryableStatus(code: number | undefined): boolean {
  return code === 429 || code === 500 || code === 503;
}

function getErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code?: number }).code;
    if (typeof code === "number") {
      return code;
    }
  }
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { status?: number } }).response;
    return response?.status;
  }
  return;
}

function backoffMs(attempt: number, limits: SheetsLimits): number {
  const base = Math.min(
    limits.initialBackoffMs * 2 ** attempt,
    limits.maxBackoffMs
  );
  const jitter = Math.floor(Math.random() * 1000);
  return base + jitter;
}

export async function withRetry<T>(
  limits: SheetsLimits,
  fn: () => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= limits.maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = getErrorStatus(err);
      if (!isRetryableStatus(status) || attempt === limits.maxRetries) {
        throw err;
      }
      await Bun.sleep(backoffMs(attempt, limits));
    }
  }
  throw lastError;
}
