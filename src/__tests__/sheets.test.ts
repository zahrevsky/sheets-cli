import { beforeEach, describe, expect, mock, test } from "bun:test";
import { defaultSheetResolver } from "../api/sheet-resolver";
import { normalizeHeader } from "../sheets";

const MULTIPLE_ROWS_REGEX = /Multiple rows/;
const NOT_FOUND_REGEX = /not found/;

// Mock sheets client factory
function createMockSheets(
  overrides: {
    getValues?: unknown[][];
    appendResult?: { updatedRange: string; updatedRows: number };
    batchUpdateResult?: { totalUpdatedCells: number };
    spreadsheetMeta?: {
      sheets: Array<{
        properties: { title: string; sheetId: number; index: number };
      }>;
    };
  } = {}
) {
  return {
    spreadsheets: {
      get: mock(() =>
        Promise.resolve({
          data: overrides.spreadsheetMeta ?? {
            sheets: [
              { properties: { title: "Sheet1", sheetId: 0, index: 0 } },
              { properties: { title: "Projects", sheetId: 123, index: 1 } },
            ],
          },
        })
      ),
      batchUpdate: mock(() =>
        Promise.resolve({
          data: { replies: [] },
        })
      ),
      values: {
        get: mock(() =>
          Promise.resolve({
            data: {
              values: overrides.getValues ?? [],
              range: "Sheet1!A1:B1",
            },
          })
        ),
        append: mock(() =>
          Promise.resolve({
            data: {
              updates: overrides.appendResult ?? {
                updatedRange: "Sheet1!A2:C2",
                updatedRows: 1,
              },
            },
          })
        ),
        update: mock(() =>
          Promise.resolve({
            data: {
              updatedRange: "Sheet1!A1:B2",
              updatedCells: 4,
            },
          })
        ),
        batchUpdate: mock(() =>
          Promise.resolve({
            data: overrides.batchUpdateResult ?? { totalUpdatedCells: 2 },
          })
        ),
      },
    },
  };
}

beforeEach(() => {
  defaultSheetResolver.invalidate("spreadsheet-id");
});

describe("sheets", () => {
  describe("normalizeHeader", () => {
    test("trims whitespace", () => {
      expect(normalizeHeader("  Name  ")).toBe("name");
    });

    test("collapses multiple spaces", () => {
      expect(normalizeHeader("Project   Name")).toBe("project name");
    });

    test("converts to lowercase", () => {
      expect(normalizeHeader("PROJECT NAME")).toBe("project name");
    });

    test("handles mixed case and spacing", () => {
      expect(normalizeHeader("  PoRtCo   NaMe  ")).toBe("portco name");
    });

    test("handles empty string", () => {
      expect(normalizeHeader("")).toBe("");
    });

    test("handles single word", () => {
      expect(normalizeHeader("Status")).toBe("status");
    });
  });
});

describe("sheets API functions", () => {
  describe("listSheets", async () => {
    const { listSheets } = await import("../sheets");

    test("returns list of sheets with metadata", async () => {
      const mockSheets = createMockSheets();
      const result = await listSheets(mockSheets as never, "spreadsheet-id");

      expect(result).toEqual([
        { name: "Sheet1", sheetId: 0, index: 0 },
        { name: "Projects", sheetId: 123, index: 1 },
      ]);
    });

    test("returns empty array for spreadsheet with no sheets", async () => {
      const mockSheets = createMockSheets({ spreadsheetMeta: { sheets: [] } });
      const result = await listSheets(mockSheets as never, "spreadsheet-id");

      expect(result).toEqual([]);
    });
  });

  describe("getSheetByGid", async () => {
    const { getSheetByGid } = await import("../sheets");

    test("finds sheet by gid", async () => {
      const mockSheets = createMockSheets();
      const result = await getSheetByGid(
        mockSheets as never,
        "spreadsheet-id",
        123
      );

      expect(result?.name).toBe("Projects");
      expect(result?.sheetId).toBe(123);
    });

    test("returns null for non-existent gid", async () => {
      const mockSheets = createMockSheets();
      const result = await getSheetByGid(
        mockSheets as never,
        "spreadsheet-id",
        999
      );

      expect(result).toBeNull();
    });
  });

  describe("getHeaderRow", async () => {
    const { getHeaderRow } = await import("../sheets");

    test("returns header row values", async () => {
      const mockSheets = createMockSheets({
        getValues: [["Name", "Status", "Date"]],
      });
      const result = await getHeaderRow(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        1
      );

      expect(result).toEqual({
        headers: ["Name", "Status", "Date"],
        headerRow: 1,
      });
    });

    test("returns empty array for empty sheet", async () => {
      const mockSheets = createMockSheets({ getValues: [] });
      const result = await getHeaderRow(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        1
      );

      expect(result).toEqual({ headers: [], headerRow: 1 });
    });
  });

  describe("readTableData", async () => {
    const { readTableData } = await import("../sheets");

    test("returns headers and rows as objects", async () => {
      const mockSheets = createMockSheets();

      // Mock two calls: first for headers, second for data
      let callCount = 0;
      mockSheets.spreadsheets.values.get = mock(() => {
        callCount += 1;
        if (callCount === 1) {
          return Promise.resolve({
            data: { values: [["Name", "Status"]], range: "Sheet1!A1:B1" },
          });
        }
        return Promise.resolve({
          data: {
            values: [
              ["Alice", "Active"],
              ["Bob", "Inactive"],
            ],
            range: "Sheet1!A2:B3",
          },
        });
      });

      const result = await readTableData(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        { headerRow: 1 }
      );

      expect(result.headers).toEqual(["_row", "Name", "Status"]);
      expect(result.rows).toEqual([
        { _row: 2, Name: "Alice", Status: "Active" },
        { _row: 3, Name: "Bob", Status: "Inactive" },
      ]);
    });

    test("_row reflects absolute sheet row number", async () => {
      const mockSheets = createMockSheets();

      let callCount = 0;
      mockSheets.spreadsheets.values.get = mock(() => {
        callCount += 1;
        if (callCount === 1) {
          // Headers on row 5
          return Promise.resolve({
            data: { values: [["Name", "Status"]], range: "Sheet1!A5:B5" },
          });
        }
        // Data starts row 6
        return Promise.resolve({
          data: {
            values: [
              ["Alice", "Active"],
              ["Bob", "Inactive"],
              ["Charlie", "Done"],
            ],
            range: "Sheet1!A6:B8",
          },
        });
      });

      const result = await readTableData(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        { headerRow: 5 }
      );

      // Data starts at row 6, so:
      // index 0 -> row 6, index 1 -> row 7, index 2 -> row 8
      expect(result.rows[0]?._row).toBe(6);
      expect(result.rows[1]?._row).toBe(7);
      expect(result.rows[2]?._row).toBe(8);
    });

    test("respects limit option", async () => {
      const mockSheets = createMockSheets();

      let callCount = 0;
      mockSheets.spreadsheets.values.get = mock(() => {
        callCount += 1;
        if (callCount === 1) {
          return Promise.resolve({
            data: { values: [["Name"]], range: "Sheet1!A1:A1" },
          });
        }
        return Promise.resolve({
          data: {
            values: [["A"], ["B"], ["C"], ["D"]],
            range: "Sheet1!A1:A4",
          },
        });
      });

      const result = await readTableData(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        {
          limit: 2,
        }
      );

      expect(result.rows).toHaveLength(2);
    });
  });

  describe("readRange", async () => {
    const { readRange } = await import("../sheets");

    test("returns raw values from range", async () => {
      const mockSheets = createMockSheets({
        getValues: [
          ["A1", "B1"],
          ["A2", "B2"],
        ],
      });

      const result = await readRange(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1!A1:B2"
      );

      expect(result).toEqual([
        ["A1", "B1"],
        ["A2", "B2"],
      ]);
    });
  });

  describe("appendRows", async () => {
    const { appendRows } = await import("../sheets");

    test("appends row with column mapping", async () => {
      const mockSheets = createMockSheets();

      let _callCount = 0;
      mockSheets.spreadsheets.values.get = mock(() => {
        _callCount += 1;
        return Promise.resolve({
          data: { values: [["Name", "Status"]], range: "Sheet1!A1:B1" },
        });
      });

      const result = await appendRows(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        { Name: "Test", Status: "Active" },
        {}
      );

      expect(result.updatedRows).toBe(1);
      expect(result.dryRun).toBe(false);
    });

    test("returns preview in dry-run mode", async () => {
      const mockSheets = createMockSheets();

      mockSheets.spreadsheets.values.get = mock(() =>
        Promise.resolve({
          data: { values: [["Name", "Status"]], range: "Sheet1!A1:B1" },
        })
      );

      const result = await appendRows(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        { Name: "Test" },
        { dryRun: true }
      );

      expect(result.dryRun).toBe(true);
      expect(mockSheets.spreadsheets.batchUpdate).not.toHaveBeenCalled();
    });

    test("does not treat header names like ID/URL as column letters", async () => {
      const mockSheets = createMockSheets();

      mockSheets.spreadsheets.values.get = mock(() =>
        Promise.resolve({
          data: {
            values: [["ID", "URL", "Status", "Company", "Position", "Source"]],
            range: "Sheet1!A1:F1",
          },
        })
      );

      await appendRows(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        {
          ID: "25",
          URL: "https://example.com",
          Status: "2do",
          Company: "Test",
          Position: "",
          Source: "Web",
        },
        { dryRun: true }
      );

      // Verify append was not called (dry-run), but check the row would
      // only span 6 columns (A-F), not 238 (A-ID)
      const calls = mockSheets.spreadsheets.batchUpdate.mock.calls;
      expect(calls).toHaveLength(0);

      const mockSheets2 = createMockSheets();
      mockSheets2.spreadsheets.values.get = mock(() =>
        Promise.resolve({
          data: {
            values: [["ID", "URL", "Status", "Company", "Position", "Source"]],
            range: "Sheet1!A1:F1",
          },
        })
      );

      await appendRows(
        mockSheets2 as never,
        "spreadsheet-id",
        "Sheet1",
        {
          ID: "25",
          URL: "https://example.com",
          Status: "2do",
          Company: "Test",
          Position: "",
          Source: "Web",
        },
        {}
      );

      const batchCalls = mockSheets2.spreadsheets.batchUpdate.mock
        .calls as unknown[][];
      expect(batchCalls).toHaveLength(1);
      const firstCall = (
        batchCalls[0] as unknown[] | undefined
      )?.[0] as unknown as {
        requestBody: {
          requests: Array<{
            appendCells?: { rows: Array<{ values: unknown[] }> };
          }>;
        };
      };
      const appendReq = firstCall.requestBody.requests[0]?.appendCells;
      expect(appendReq?.rows[0]?.values).toHaveLength(6);
      const cellValues = appendReq?.rows[0]?.values ?? [];
      const strings = cellValues.map((c) => {
        const cell = c as { userEnteredValue?: { stringValue?: string } };
        return cell.userEnteredValue?.stringValue ?? "";
      });
      expect(strings).toEqual([
        "25",
        "https://example.com",
        "2do",
        "Test",
        "",
        "Web",
      ]);
    });
  });

  describe("updateByRowIndex", async () => {
    const { updateByRowIndex } = await import("../sheets");

    test("updates cells at specified row", async () => {
      const mockSheets = createMockSheets();

      mockSheets.spreadsheets.values.get = mock(() =>
        Promise.resolve({
          data: { values: [["Name", "Status"]], range: "Sheet1!A1:B1" },
        })
      );

      const result = await updateByRowIndex(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        5,
        { Status: "Done" },
        {}
      );

      expect(result.updatedCells).toBe(1);
      expect(result.dryRun).toBe(false);
      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalled();
    });

    test("treats ID header as header name not column letter", async () => {
      const mockSheets = createMockSheets();

      mockSheets.spreadsheets.values.get = mock(() =>
        Promise.resolve({
          data: { values: [["ID", "Status"]], range: "Sheet1!A1:B1" },
        })
      );

      const result = await updateByRowIndex(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        5,
        { ID: "42" },
        {}
      );

      expect(result.updatedCells).toBe(1);
      const calls = mockSheets.spreadsheets.batchUpdate.mock
        .calls as unknown[][];
      const body = calls[0]?.[0] as unknown as {
        requestBody: {
          requests: Array<{
            updateCells?: {
              range?: { startColumnIndex?: number; startRowIndex?: number };
            };
          }>;
        };
      };
      const grid = body.requestBody.requests[0]?.updateCells?.range;
      expect(grid?.startColumnIndex).toBe(0);
      expect(grid?.startRowIndex).toBe(4);
    });

    test("skips unknown columns", async () => {
      const mockSheets = createMockSheets();

      mockSheets.spreadsheets.values.get = mock(() =>
        Promise.resolve({
          data: { values: [["Name", "Status"]], range: "Sheet1!A1:B1" },
        })
      );

      const result = await updateByRowIndex(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        5,
        { UnknownColumn: "value" },
        {}
      );

      expect(result.updatedCells).toBe(0);
    });
  });

  describe("updateByKey", async () => {
    const { updateByKey } = await import("../sheets");

    test("finds and updates row by key column", async () => {
      const mockSheets = createMockSheets();

      let callCount = 0;
      mockSheets.spreadsheets.values.get = mock(() => {
        callCount += 1;
        if (callCount === 1) {
          // Headers
          return Promise.resolve({
            data: { values: [["Name", "Status"]], range: "Sheet1!A1:B1" },
          });
        }
        // Key column values
        return Promise.resolve({
          data: {
            values: [["Alice"], ["Bob"], ["Charlie"]],
            range: "Sheet1!A2:A4",
          },
        });
      });

      const result = await updateByKey(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        "Name",
        "Bob",
        { Status: "Updated" },
        { headerRow: 1 }
      );

      expect(result.matchedRows).toBe(1);
      expect(result.updatedCells).toBe(1);
    });

    test("returns zero matches for non-existent key", async () => {
      const mockSheets = createMockSheets();

      let callCount = 0;
      mockSheets.spreadsheets.values.get = mock(() => {
        callCount += 1;
        if (callCount === 1) {
          return Promise.resolve({
            data: { values: [["Name", "Status"]], range: "Sheet1!A1:B1" },
          });
        }
        return Promise.resolve({
          data: { values: [["Alice"], ["Bob"]], range: "Sheet1!A2:A3" },
        });
      });

      const result = await updateByKey(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        "Name",
        "NonExistent",
        { Status: "X" },
        {}
      );

      expect(result.matchedRows).toBe(0);
      expect(result.updatedCells).toBe(0);
    });

    test("throws error on multiple matches without allowMulti", async () => {
      const mockSheets = createMockSheets();

      let callCount = 0;
      mockSheets.spreadsheets.values.get = mock(() => {
        callCount += 1;
        if (callCount === 1) {
          return Promise.resolve({
            data: { values: [["Name", "Status"]], range: "Sheet1!A1:B1" },
          });
        }
        return Promise.resolve({
          data: { values: [["Alice"], ["Alice"]], range: "Sheet1!A2:A3" },
        });
      });

      await expect(
        updateByKey(
          mockSheets as never,
          "spreadsheet-id",
          "Sheet1",
          "Name",
          "Alice",
          { Status: "X" },
          {}
        )
      ).rejects.toThrow(MULTIPLE_ROWS_REGEX);
    });

    test("updates multiple rows with allowMulti", async () => {
      const mockSheets = createMockSheets();

      let callCount = 0;
      mockSheets.spreadsheets.values.get = mock(() => {
        callCount += 1;
        if (callCount === 1) {
          return Promise.resolve({
            data: { values: [["Name", "Status"]], range: "Sheet1!A1:B1" },
          });
        }
        return Promise.resolve({
          data: { values: [["Alice"], ["Alice"]], range: "Sheet1!A2:A3" },
        });
      });

      const result = await updateByKey(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1",
        "Name",
        "Alice",
        { Status: "Both" },
        { allowMulti: true, headerRow: 1 }
      );

      expect(result.matchedRows).toBe(2);
      expect(result.updatedCells).toBe(2);
    });

    test("throws error for non-existent key column", async () => {
      const mockSheets = createMockSheets();

      mockSheets.spreadsheets.values.get = mock(() =>
        Promise.resolve({
          data: { values: [["Name", "Status"]], range: "Sheet1!A1:B1" },
        })
      );

      await expect(
        updateByKey(
          mockSheets as never,
          "spreadsheet-id",
          "Sheet1",
          "NonExistentCol",
          "value",
          { Status: "X" },
          {}
        )
      ).rejects.toThrow(NOT_FOUND_REGEX);
    });
  });

  describe("setRange", async () => {
    const { setRange } = await import("../sheets");

    test("sets values in range", async () => {
      const mockSheets = createMockSheets();

      const result = await setRange(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1!A1:B2",
        [
          ["a", "b"],
          ["c", "d"],
        ],
        {}
      );

      expect(result.updatedCells).toBe(4);
      expect(result.dryRun).toBe(false);
    });

    test("returns preview in dry-run mode", async () => {
      const mockSheets = createMockSheets();

      const result = await setRange(
        mockSheets as never,
        "spreadsheet-id",
        "Sheet1!A1:B2",
        [
          ["a", "b"],
          ["c", "d"],
        ],
        { dryRun: true }
      );

      expect(result.dryRun).toBe(true);
      expect(result.updatedCells).toBe(4);
      expect(mockSheets.spreadsheets.batchUpdate).not.toHaveBeenCalled();
    });
  });

  describe("batchOperations", async () => {
    const { batchOperations } = await import("../sheets");

    test("executes multiple operations", async () => {
      const mockSheets = createMockSheets();

      mockSheets.spreadsheets.values.get = mock(() =>
        Promise.resolve({
          data: { values: [["Name", "Status"]], range: "Sheet1!A1:B1" },
        })
      );

      const result = await batchOperations(
        mockSheets as never,
        "spreadsheet-id",
        [
          { op: "append", sheet: "Sheet1", values: { Name: "Test" } },
          { op: "setRange", range: "Sheet1!A1", values: [["Updated"]] },
        ],
        {}
      );

      expect(result.results).toHaveLength(2);
      expect(result.dryRun).toBe(false);
    });

    test("respects dry-run for all operations", async () => {
      const mockSheets = createMockSheets();

      mockSheets.spreadsheets.values.get = mock(() =>
        Promise.resolve({
          data: { values: [["Name"]], range: "Sheet1!A1:A1" },
        })
      );

      const result = await batchOperations(
        mockSheets as never,
        "spreadsheet-id",
        [{ op: "append", sheet: "Sheet1", values: { Name: "Test" } }],
        { dryRun: true }
      );

      expect(result.dryRun).toBe(true);
      expect(mockSheets.spreadsheets.batchUpdate).not.toHaveBeenCalled();
    });
  });
});
