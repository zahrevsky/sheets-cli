import type { sheets_v4 } from "googleapis";
import { buildUpdateCellsRequest } from "../builders/cells";
import type { ValueInputOption } from "../types";

export type CellUpdate = {
  rowIndex: number;
  colIndex: number;
  value: unknown;
};

export function cellUpdatesToRequests(
  sheetId: number,
  updates: CellUpdate[],
  valueInputOption: ValueInputOption
): sheets_v4.Schema$Request[] {
  if (updates.length === 0) {
    return [];
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
        valueInputOption,
      })
    );
  }

  return requests;
}
