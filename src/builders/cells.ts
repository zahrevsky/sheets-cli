import type { sheets_v4 } from "googleapis";
import type { ValueInputOption } from "../types";
import { rowFromValues } from "./extended-value";
import type { GridRangeInput } from "./grid-range";

export function buildUpdateCellsRequest(opts: {
  range: GridRangeInput;
  values: unknown[][];
  valueInputOption: ValueInputOption;
}): sheets_v4.Schema$Request {
  const rows = opts.values.map((row) =>
    rowFromValues(row, opts.valueInputOption)
  );
  return {
    updateCells: {
      range: opts.range,
      rows,
      fields: "userEnteredValue",
    },
  };
}

export function buildAppendCellsRequest(opts: {
  sheetId: number;
  values: unknown[][];
  valueInputOption: ValueInputOption;
}): sheets_v4.Schema$Request {
  const rows = opts.values.map((row) =>
    rowFromValues(row, opts.valueInputOption)
  );
  return {
    appendCells: {
      sheetId: opts.sheetId,
      rows,
      fields: "userEnteredValue",
    },
  };
}

export function buildInsertRowsRequest(opts: {
  sheetId: number;
  startIndex: number;
  endIndex: number;
}): sheets_v4.Schema$Request {
  return {
    insertDimension: {
      range: {
        sheetId: opts.sheetId,
        dimension: "ROWS",
        startIndex: opts.startIndex,
        endIndex: opts.endIndex,
      },
      inheritFromBefore: false,
    },
  };
}
