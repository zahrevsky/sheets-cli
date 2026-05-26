import type { sheets_v4 } from "googleapis";

export function buildAddSheetRequest(opts: {
  title: string;
  sheetId?: number;
}): sheets_v4.Schema$Request {
  return {
    addSheet: {
      properties: {
        title: opts.title,
        ...(opts.sheetId !== undefined ? { sheetId: opts.sheetId } : {}),
      },
    },
  };
}

export function buildDeleteSheetRequest(
  sheetId: number
): sheets_v4.Schema$Request {
  return { deleteSheet: { sheetId } };
}

export function buildDuplicateSheetRequest(opts: {
  sourceSheetId: number;
  newSheetId?: number;
  newSheetName?: string;
}): sheets_v4.Schema$Request {
  return {
    duplicateSheet: {
      sourceSheetId: opts.sourceSheetId,
      ...(opts.newSheetId !== undefined ? { newSheetId: opts.newSheetId } : {}),
      newSheetName: opts.newSheetName,
    },
  };
}

export function buildUpdateSheetPropertiesRequest(opts: {
  sheetId: number;
  properties: sheets_v4.Schema$SheetProperties;
  fields: string;
}): sheets_v4.Schema$Request {
  return {
    updateSheetProperties: {
      properties: { sheetId: opts.sheetId, ...opts.properties },
      fields: opts.fields,
    },
  };
}

export function buildHideSheetRequest(
  sheetId: number
): sheets_v4.Schema$Request {
  return buildUpdateSheetPropertiesRequest({
    sheetId,
    properties: { hidden: true },
    fields: "hidden",
  });
}

export function buildShowSheetRequest(
  sheetId: number
): sheets_v4.Schema$Request {
  return buildUpdateSheetPropertiesRequest({
    sheetId,
    properties: { hidden: false },
    fields: "hidden",
  });
}
