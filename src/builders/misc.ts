import type { sheets_v4 } from "googleapis";
import type { GridRangeInput } from "./grid-range";

export function buildRepeatCellRequest(opts: {
  range: GridRangeInput;
  cell: sheets_v4.Schema$CellData;
  fields: string;
}): sheets_v4.Schema$Request {
  return {
    repeatCell: {
      range: opts.range,
      cell: opts.cell,
      fields: opts.fields,
    },
  };
}

export function buildSetDataValidationRequest(opts: {
  range: GridRangeInput;
  rule: sheets_v4.Schema$DataValidationRule;
}): sheets_v4.Schema$Request {
  return {
    setDataValidation: {
      range: opts.range,
      rule: opts.rule,
    },
  };
}

export function buildAddProtectedRangeRequest(
  protectedRange: sheets_v4.Schema$ProtectedRange
): sheets_v4.Schema$Request {
  return { addProtectedRange: { protectedRange } };
}

export function buildDeleteProtectedRangeRequest(
  protectedRangeId: number
): sheets_v4.Schema$Request {
  return { deleteProtectedRange: { protectedRangeId } };
}

export function buildAddNamedRangeRequest(
  namedRange: sheets_v4.Schema$NamedRange
): sheets_v4.Schema$Request {
  return { addNamedRange: { namedRange } };
}

export function buildDeleteNamedRangeRequest(
  namedRangeId: string
): sheets_v4.Schema$Request {
  return { deleteNamedRange: { namedRangeId } };
}

export function buildAutoResizeDimensionsRequest(opts: {
  sheetId: number;
  dimension: "ROWS" | "COLUMNS";
  startIndex: number;
  endIndex: number;
}): sheets_v4.Schema$Request {
  return {
    autoResizeDimensions: {
      dimensions: {
        sheetId: opts.sheetId,
        dimension: opts.dimension,
        startIndex: opts.startIndex,
        endIndex: opts.endIndex,
      },
    },
  };
}

export function buildCopyPasteRequest(opts: {
  source: GridRangeInput;
  destination: GridRangeInput;
  pasteType?: sheets_v4.Schema$CopyPasteRequest["pasteType"];
}): sheets_v4.Schema$Request {
  return {
    copyPaste: {
      source: opts.source,
      destination: opts.destination,
      pasteType: opts.pasteType ?? "PASTE_NORMAL",
    },
  };
}

export function buildPasteDataRequest(opts: {
  coordinate: { sheetId: number; rowIndex: number; columnIndex: number };
  data: string;
  type?: sheets_v4.Schema$PasteDataRequest["type"];
}): sheets_v4.Schema$Request {
  return {
    pasteData: {
      coordinate: opts.coordinate,
      data: opts.data,
      type: opts.type ?? "PASTE_NORMAL",
    },
  };
}
