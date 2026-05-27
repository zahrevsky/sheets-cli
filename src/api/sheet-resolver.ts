import type { sheets_v4 } from "googleapis";

export type SheetRef = { sheetId: number; title: string };

export class SheetResolver {
  private readonly cache = new Map<string, SheetRef[]>();

  async list(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string
  ): Promise<SheetRef[]> {
    const cached = this.cache.get(spreadsheetId);
    if (cached) {
      return cached;
    }
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const list =
      res.data.sheets?.map((s) => ({
        sheetId: s.properties?.sheetId ?? 0,
        title: s.properties?.title ?? "",
      })) ?? [];
    this.cache.set(spreadsheetId, list);
    return list;
  }

  invalidate(spreadsheetId: string): void {
    this.cache.delete(spreadsheetId);
  }

  async resolveByTitle(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    title: string
  ): Promise<SheetRef | null> {
    const list = await this.list(sheets, spreadsheetId);
    return list.find((s) => s.title === title) ?? null;
  }

  async resolveByGid(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    gid: number
  ): Promise<SheetRef | null> {
    const list = await this.list(sheets, spreadsheetId);
    return list.find((s) => s.sheetId === gid) ?? null;
  }
}

export const defaultSheetResolver = new SheetResolver();
