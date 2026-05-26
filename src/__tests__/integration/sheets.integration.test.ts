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

    try {
      const sheets = getSheetsClient(auth);
      await appendRows(
        sheets,
        spreadsheetId,
        "Sheet1",
        {
          Name: "Integration",
          Status: "ok",
        },
        {}
      );
      const table = await readTableData(sheets, spreadsheetId, "Sheet1", {
        limit: 5,
      });
      expect(table.rows.length).toBeGreaterThan(0);
    } finally {
      await drive.files.delete({ fileId: spreadsheetId });
    }
  });
});
