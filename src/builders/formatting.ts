import type { sheets_v4 } from "googleapis";
import type { GridRangeInput } from "./grid-range";

export function buildAddConditionalFormatRuleRequest(opts: {
  index?: number;
  rule: sheets_v4.Schema$ConditionalFormatRule;
}): sheets_v4.Schema$Request {
  return {
    addConditionalFormatRule: {
      rule: opts.rule,
      index: opts.index ?? 0,
    },
  };
}

export function buildUpdateConditionalFormatRuleRequest(opts: {
  sheetId: number;
  index: number;
  rule: sheets_v4.Schema$ConditionalFormatRule;
}): sheets_v4.Schema$Request {
  return {
    updateConditionalFormatRule: {
      sheetId: opts.sheetId,
      index: opts.index,
      rule: opts.rule,
    },
  };
}

export function buildDeleteConditionalFormatRuleRequest(opts: {
  sheetId: number;
  index: number;
}): sheets_v4.Schema$Request {
  return {
    deleteConditionalFormatRule: {
      sheetId: opts.sheetId,
      index: opts.index,
    },
  };
}

export function buildMergeCellsRequest(
  range: GridRangeInput,
  mergeType: "MERGE_ALL" | "MERGE_COLUMNS" | "MERGE_ROWS" = "MERGE_ALL"
): sheets_v4.Schema$Request {
  return { mergeCells: { range, mergeType } };
}

export function buildUnmergeCellsRequest(
  range: GridRangeInput
): sheets_v4.Schema$Request {
  return { unmergeCells: { range } };
}

export function buildUpdateBordersRequest(
  range: GridRangeInput,
  top?: sheets_v4.Schema$Border,
  bottom?: sheets_v4.Schema$Border,
  left?: sheets_v4.Schema$Border,
  right?: sheets_v4.Schema$Border
): sheets_v4.Schema$Request {
  return {
    updateBorders: {
      range,
      top,
      bottom,
      left,
      right,
    },
  };
}
