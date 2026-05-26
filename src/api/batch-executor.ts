import type { sheets_v4 } from "googleapis";
import { estimatePayloadBytes, loadLimits, type SheetsLimits } from "./limits";
import { withRetry } from "./retry";

export type BatchExecuteResult = {
  replies: sheets_v4.Schema$Response[];
  requestCount: number;
};

function chunkRequests(
  requests: sheets_v4.Schema$Request[],
  limits: SheetsLimits
): sheets_v4.Schema$Request[][] {
  const chunks: sheets_v4.Schema$Request[][] = [];
  let current: sheets_v4.Schema$Request[] = [];

  for (const req of requests) {
    const candidate = [...current, req];
    const body = { requests: candidate };
    const tooMany =
      candidate.length > limits.maxSubrequestsPerBatch ||
      estimatePayloadBytes(body) > limits.maxPayloadBytes;
    if (tooMany && current.length > 0) {
      chunks.push(current);
      current = [req];
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) {
    chunks.push(current);
  }
  return chunks;
}

export class BatchExecutor {
  private writeTimestamps: number[] = [];
  private readonly limits: SheetsLimits;

  constructor(limits: SheetsLimits = loadLimits()) {
    this.limits = limits;
  }

  private async throttleWrite(): Promise<void> {
    const now = Date.now();
    this.writeTimestamps = this.writeTimestamps.filter((t) => now - t < 60_000);
    if (this.writeTimestamps.length >= this.limits.maxWritePerMinute) {
      const waitMs = 60_000 - (now - (this.writeTimestamps[0] ?? now)) + 50;
      if (waitMs > 0) {
        await Bun.sleep(waitMs);
      }
    }
    this.writeTimestamps.push(Date.now());
  }

  async execute(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    requests: sheets_v4.Schema$Request[]
  ): Promise<BatchExecuteResult> {
    if (requests.length === 0) {
      return { replies: [], requestCount: 0 };
    }

    const chunks = chunkRequests(requests, this.limits);
    const allReplies: sheets_v4.Schema$Response[] = [];

    for (const chunk of chunks) {
      await this.throttleWrite();
      const res = await withRetry(this.limits, () =>
        sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests: chunk },
        })
      );
      allReplies.push(...(res.data.replies ?? []));
    }

    return { replies: allReplies, requestCount: chunks.length };
  }
}

export const defaultBatchExecutor = new BatchExecutor();
