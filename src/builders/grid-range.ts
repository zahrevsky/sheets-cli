export type GridRangeInput = {
  sheetId: number;
  startRowIndex?: number;
  endRowIndex?: number;
  startColumnIndex?: number;
  endColumnIndex?: number;
};

const SHEET_PREFIX_REGEX = /^'([^']*)'!/;
const SIMPLE_PREFIX_REGEX = /^([^'!]+)!/;
const CELL_PART_REGEX = /^([A-Za-z]+)?(\d+)?$/;

function colLetterToIndex(letter: string): number {
  const s = letter.toUpperCase();
  let n = 0;
  for (const ch of s) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

function parseCellPart(part: string): { col?: number; row?: number } {
  const match = part.match(CELL_PART_REGEX);
  if (!match) {
    return {};
  }
  const col = match[1] ? colLetterToIndex(match[1]) : undefined;
  const row = match[2] ? Number.parseInt(match[2], 10) - 1 : undefined;
  return { col, row };
}

export function parseA1RangeToGrid(
  range: string,
  sheetId: number
): GridRangeInput {
  let a1 = range;
  if (range.includes("!")) {
    a1 = range.split("!")[1] ?? range;
  }
  const [startPart, endPart] = a1.split(":");
  const start = parseCellPart(startPart ?? "");
  const end = endPart ? parseCellPart(endPart) : start;

  const grid: GridRangeInput = { sheetId };
  if (start.row !== undefined) {
    grid.startRowIndex = start.row;
  }
  if (end.row !== undefined) {
    grid.endRowIndex = end.row + 1;
  } else if (start.row !== undefined) {
    grid.endRowIndex = start.row + 1;
  }
  if (start.col !== undefined) {
    grid.startColumnIndex = start.col;
  }
  if (end.col !== undefined) {
    grid.endColumnIndex = end.col + 1;
  } else if (start.col !== undefined) {
    grid.endColumnIndex = start.col + 1;
  }
  return grid;
}

export function extractSheetNameFromRange(range: string): string | null {
  const quoted = range.match(SHEET_PREFIX_REGEX);
  if (quoted?.[1]) {
    return quoted[1].replaceAll("''", "'");
  }
  const simple = range.match(SIMPLE_PREFIX_REGEX);
  if (simple?.[1] && !simple[1].includes("!")) {
    return simple[1];
  }
  return null;
}
