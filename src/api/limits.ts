export type SheetsLimits = {
  maxReadPerMinute: number;
  maxWritePerMinute: number;
  maxPayloadBytes: number;
  maxSubrequestsPerBatch: number;
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
};

export const DEFAULT_LIMITS: SheetsLimits = {
  maxReadPerMinute: 280,
  maxWritePerMinute: 280,
  maxPayloadBytes: 2_000_000,
  maxSubrequestsPerBatch: 100,
  maxRetries: 5,
  initialBackoffMs: 1000,
  maxBackoffMs: 64_000,
};

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function loadLimits(): SheetsLimits {
  return {
    maxReadPerMinute: parseEnvInt(
      "SHEETS_CLI_MAX_READ_PER_MINUTE",
      DEFAULT_LIMITS.maxReadPerMinute
    ),
    maxWritePerMinute: parseEnvInt(
      "SHEETS_CLI_MAX_WRITE_PER_MINUTE",
      DEFAULT_LIMITS.maxWritePerMinute
    ),
    maxPayloadBytes: parseEnvInt(
      "SHEETS_CLI_MAX_PAYLOAD_BYTES",
      DEFAULT_LIMITS.maxPayloadBytes
    ),
    maxSubrequestsPerBatch: parseEnvInt(
      "SHEETS_CLI_MAX_SUBREQUESTS_PER_BATCH",
      DEFAULT_LIMITS.maxSubrequestsPerBatch
    ),
    maxRetries: parseEnvInt(
      "SHEETS_CLI_MAX_RETRIES",
      DEFAULT_LIMITS.maxRetries
    ),
    initialBackoffMs: parseEnvInt(
      "SHEETS_CLI_INITIAL_BACKOFF_MS",
      DEFAULT_LIMITS.initialBackoffMs
    ),
    maxBackoffMs: parseEnvInt(
      "SHEETS_CLI_MAX_BACKOFF_MS",
      DEFAULT_LIMITS.maxBackoffMs
    ),
  };
}

export function estimatePayloadBytes(body: unknown): number {
  return new TextEncoder().encode(JSON.stringify(body)).length;
}
