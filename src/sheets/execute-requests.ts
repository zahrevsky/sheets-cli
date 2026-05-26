import type { sheets_v4 } from "googleapis";

export async function executeSpreadsheetRequests(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  requests: sheets_v4.Schema$Request[],
  dryRun: boolean
): Promise<{
  dryRun: boolean;
  requestCount: number;
  requests: sheets_v4.Schema$Request[];
  replies?: sheets_v4.Schema$Response[];
}> {
  if (dryRun) {
    return { dryRun: true, requestCount: 0, requests };
  }
  const { defaultBatchExecutor } = await import("../api/batch-executor");
  const result = await defaultBatchExecutor.execute(
    sheets,
    spreadsheetId,
    requests
  );
  return {
    dryRun: false,
    requestCount: result.requestCount,
    requests,
    replies: result.replies,
  };
}
