import { describe, expect, test } from "bun:test";
import { buildSpreadsheetsListQuery } from "../../sheets/drive-spreadsheets";

describe("drive spreadsheets", () => {
  test("buildSpreadsheetsListQuery lists all non-trashed spreadsheets", () => {
    expect(buildSpreadsheetsListQuery()).toBe(
      "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
    );
  });

  test("buildSpreadsheetsListQuery escapes name filter", () => {
    expect(buildSpreadsheetsListQuery("O'Brien")).toContain(
      "name contains 'O\\'Brien'"
    );
  });
});
