import { describe, expect, mock, test } from "bun:test";
import { BatchExecutor } from "../../api/batch-executor";
import { DEFAULT_LIMITS } from "../../api/limits";

describe("BatchExecutor", () => {
  test("chunks large request lists", async () => {
    const batchUpdate = mock(() => Promise.resolve({ data: { replies: [] } }));
    const sheets = {
      spreadsheets: { batchUpdate },
    };
    const limits = { ...DEFAULT_LIMITS, maxSubrequestsPerBatch: 2 };
    const executor = new BatchExecutor(limits);
    const requests = Array.from({ length: 5 }, (_, i) => ({
      deleteSheet: { sheetId: i + 10 },
    }));
    const result = await executor.execute(
      sheets as never,
      "spreadsheet-id",
      requests
    );
    expect(result.requestCount).toBe(3);
    expect(batchUpdate).toHaveBeenCalledTimes(3);
  });

  test("empty requests returns zero count", async () => {
    const executor = new BatchExecutor(DEFAULT_LIMITS);
    const sheets = { spreadsheets: { batchUpdate: mock() } };
    const result = await executor.execute(sheets as never, "id", []);
    expect(result.requestCount).toBe(0);
  });
});
