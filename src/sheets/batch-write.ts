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

export async function runBatchWrite(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  requests: sheets_v4.Schema$Request[],
  dryRun: boolean
): Promise<{ requestCount: number; requests: sheets_v4.Schema$Request[] }> {
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
  opts: { valueInputOption: ValueInputOption; dryRun?: boolean }
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
    opts.dryRun ?? false
  );
  const cells = values.reduce((acc, row) => acc + row.length, 0);
  return { updatedCells: cells, requestCount: run.requestCount };
}

export async function appendRowViaBatch(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetId: number,
  row: unknown[],
  opts: { valueInputOption: ValueInputOption; dryRun?: boolean }
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
    opts.dryRun ?? false
  );
  return { requestCount: run.requestCount };
}

export async function writeCellsViaBatch(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetId: number,
  updates: { rowIndex: number; colIndex: number; value: unknown }[],
  opts: { valueInputOption: ValueInputOption; dryRun?: boolean }
): Promise<{ updatedCells: number; requestCount: number }> {
  if (updates.length === 0) {
    return { updatedCells: 0, requestCount: 0 };
  }

  const byRow = new Map<number, Map<number, unknown>>();
  for (const u of updates) {
    let row = byRow.get(u.rowIndex);
    if (!row) {
      row = new Map();
      byRow.set(u.rowIndex, row);
    }
    row.set(u.colIndex, u.value);
  }

  const requests: sheets_v4.Schema$Request[] = [];
  for (const [rowIndex, cols] of byRow) {
    const colIndices = [...cols.keys()].sort((a, b) => a - b);
    const startCol = colIndices[0] ?? 0;
    const endCol = (colIndices.at(-1) ?? startCol) + 1;
    const values: unknown[][] = [
      Array.from({ length: endCol - startCol }, (_, i) => {
        const col = startCol + i;
        return cols.get(col) ?? "";
      }),
    ];
    requests.push(
      buildUpdateCellsRequest({
        range: {
          sheetId,
          startRowIndex: rowIndex,
          endRowIndex: rowIndex + 1,
          startColumnIndex: startCol,
          endColumnIndex: endCol,
        },
        values,
        valueInputOption: opts.valueInputOption,
      })
    );
  }

  const run = await runBatchWrite(
    sheets,
    spreadsheetId,
    requests,
    opts.dryRun ?? false
  );
  return { updatedCells: updates.length, requestCount: run.requestCount };
}
