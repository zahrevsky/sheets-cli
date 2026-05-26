import type { sheets_v4 } from "googleapis";
import { defaultBatchExecutor } from "../api/batch-executor";
import { defaultSheetResolver } from "../api/sheet-resolver";
import {
  buildAppendCellsRequest,
  buildUpdateCellsRequest,
} from "../builders/cells";
import {
  extractSheetNameFromRange,
  parseA1RangeToGrid,
} from "../builders/grid-range";
import type { ValueInputOption } from "../types";
import { cellUpdatesToRequests } from "./cell-updates";

export async function runBatchWrite(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  requests: sheets_v4.Schema$Request[],
  dryRun: boolean,
  collector?: sheets_v4.Schema$Request[]
): Promise<{ requestCount: number; requests: sheets_v4.Schema$Request[] }> {
  if (collector) {
    collector.push(...requests);
    return { requestCount: 0, requests };
  }
  if (dryRun) {
    return { requestCount: 0, requests };
  }
  const result = await defaultBatchExecutor.execute(
    sheets,
    spreadsheetId,
    requests
  );
  return { requestCount: result.requestCount, requests };
}

export async function writeRangeViaBatch(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  range: string,
  values: unknown[][],
  opts: {
    valueInputOption: ValueInputOption;
    dryRun?: boolean;
    collector?: sheets_v4.Schema$Request[];
  }
): Promise<{ updatedCells: number; requestCount: number }> {
  const sheetName = extractSheetNameFromRange(range);
  if (!sheetName) {
    throw new Error(`Range must include sheet name: ${range}`);
  }
  const sheet = await defaultSheetResolver.resolveByTitle(
    sheets,
    spreadsheetId,
    sheetName
  );
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  const grid = parseA1RangeToGrid(range, sheet.sheetId);
  const request = buildUpdateCellsRequest({
    range: grid,
    values,
    valueInputOption: opts.valueInputOption,
  });
  const run = await runBatchWrite(
    sheets,
    spreadsheetId,
    [request],
    opts.dryRun ?? false,
    opts.collector
  );
  const cells = values.reduce((acc, row) => acc + row.length, 0);
  return { updatedCells: cells, requestCount: run.requestCount };
}

export async function appendRowViaBatch(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetId: number,
  row: unknown[],
  opts: {
    valueInputOption: ValueInputOption;
    dryRun?: boolean;
    collector?: sheets_v4.Schema$Request[];
  }
): Promise<{ requestCount: number }> {
  const request = buildAppendCellsRequest({
    sheetId,
    values: [row],
    valueInputOption: opts.valueInputOption,
  });
  const run = await runBatchWrite(
    sheets,
    spreadsheetId,
    [request],
    opts.dryRun ?? false,
    opts.collector
  );
  return { requestCount: run.requestCount };
}

export async function writeCellsViaBatch(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetId: number,
  updates: { rowIndex: number; colIndex: number; value: unknown }[],
  opts: {
    valueInputOption: ValueInputOption;
    dryRun?: boolean;
    collector?: sheets_v4.Schema$Request[];
  }
): Promise<{ updatedCells: number; requestCount: number }> {
  if (updates.length === 0) {
    return { updatedCells: 0, requestCount: 0 };
  }

  const requests = cellUpdatesToRequests(
    sheetId,
    updates,
    opts.valueInputOption
  );

  const run = await runBatchWrite(
    sheets,
    spreadsheetId,
    requests,
    opts.dryRun ?? false,
    opts.collector
  );
  return { updatedCells: updates.length, requestCount: run.requestCount };
}
