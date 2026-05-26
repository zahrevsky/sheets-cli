import type { sheets_v4 } from "googleapis";

export function buildInsertDimensionRequest(opts: {
  sheetId: number;
  dimension: "ROWS" | "COLUMNS";
  startIndex: number;
  endIndex: number;
  inheritFromBefore?: boolean;
}): sheets_v4.Schema$Request {
  return {
    insertDimension: {
      range: {
        sheetId: opts.sheetId,
        dimension: opts.dimension,
        startIndex: opts.startIndex,
        endIndex: opts.endIndex,
      },
      inheritFromBefore: opts.inheritFromBefore ?? false,
    },
  };
}

export function buildDeleteDimensionRequest(opts: {
  sheetId: number;
  dimension: "ROWS" | "COLUMNS";
  startIndex: number;
  endIndex: number;
}): sheets_v4.Schema$Request {
  return {
    deleteDimension: {
      range: {
        sheetId: opts.sheetId,
        dimension: opts.dimension,
        startIndex: opts.startIndex,
        endIndex: opts.endIndex,
      },
    },
  };
}

export function buildSortRangeRequest(opts: {
  range: sheets_v4.Schema$GridRange;
  sortSpecs: sheets_v4.Schema$SortSpec[];
}): sheets_v4.Schema$Request {
  return {
    sortRange: {
      range: opts.range,
      sortSpecs: opts.sortSpecs,
    },
  };
}

export function buildFindReplaceRequest(opts: {
  sheetId?: number;
  allSheets?: boolean;
  find: string;
  replacement: string;
  matchCase?: boolean;
  searchByRegex?: boolean;
  includeFormulas?: boolean;
}): sheets_v4.Schema$Request {
  return {
    findReplace: {
      find: opts.find,
      replacement: opts.replacement,
      matchCase: opts.matchCase,
      searchByRegex: opts.searchByRegex,
      includeFormulas: opts.includeFormulas,
      ...(opts.allSheets
        ? { allSheets: true }
        : { sheetId: opts.sheetId ?? 0 }),
    },
  };
}
