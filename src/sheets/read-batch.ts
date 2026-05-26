import type { sheets_v4 } from "googleapis";

export async function batchGetValues(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  ranges: string[],
  opts?: { valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" }
): Promise<unknown[][][]> {
  if (ranges.length === 0) {
    return [];
  }
  if (ranges.length === 1) {
    const single = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: ranges[0],
      valueRenderOption: opts?.valueRenderOption,
    });
    return [single.data.values ?? []];
  }
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: opts?.valueRenderOption,
  });
  return (res.data.valueRanges ?? []).map((vr) => vr.values ?? []);
}
