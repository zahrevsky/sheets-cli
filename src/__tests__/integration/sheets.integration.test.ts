import { describe, expect, test } from "bun:test";

const INTEGRATION = process.env.SHEETS_CLI_INTEGRATION === "1";

describe.skipIf(!INTEGRATION)("sheets integration", () => {
  test("creates spreadsheet, appends row, reads back", async () => {
    const { getAuthClient } = await import("../../auth");
    const { getSheetsClient, appendRows, readTableData } = await import(
      "../../sheets"
    );
    const { google } = await import("googleapis");

    const auth = await getAuthClient();
    if (!auth) {
      throw new Error("Integration requires ~/.sheets-cli/token.json");
    }

    const drive = google.drive({ version: "v3", auth });
    const created = await drive.files.create({
      requestBody: {
        name: `sheets-cli-test-${Date.now()}`,
        mimeType: "application/vnd.google-apps.spreadsheet",
      },
      fields: "id",
    });
    const spreadsheetId = created.data.id;
    if (!spreadsheetId) {
      throw new Error("Failed to create test spreadsheet");
    }

    const sheets = getSheetsClient(auth);
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetName = meta.data.sheets?.[0]?.properties?.title;
    if (!sheetName) {
      throw new Error("Spreadsheet has no sheets");
    }

    try {
      await appendRows(
        sheets,
        spreadsheetId,
        sheetName,
        {
          Name: "Integration",
          Status: "ok",
        },
        {}
      );
      const table = await readTableData(sheets, spreadsheetId, sheetName, {
        limit: 5,
      });
      expect(table.rows.length).toBeGreaterThan(0);
    } finally {
      await drive.files.delete({ fileId: spreadsheetId });
    }
  });

  test("lists spreadsheets via Drive API", async () => {
    const { getAuthClient } = await import("../../auth");
    const { listSpreadsheetsInDrive } = await import(
      "../../sheets/drive-spreadsheets"
    );

    const auth = await getAuthClient();
    if (!auth) {
      throw new Error("Integration requires ~/.sheets-cli/token.json");
    }

    const result = await listSpreadsheetsInDrive(auth, { limit: 5 });
    expect(Array.isArray(result.spreadsheets)).toBe(true);
    expect(result.count).toBeGreaterThanOrEqual(0);
    if (result.spreadsheets.length > 0) {
      const first = result.spreadsheets[0];
      expect(["my_drive", "shared_drive", "shared_with_me"]).toContain(
        first?.origin ?? ""
      );
    }
  });
});
