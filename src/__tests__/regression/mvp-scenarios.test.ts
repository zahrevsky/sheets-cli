import { beforeEach, describe, expect, mock, test } from "bun:test";
import { defaultSheetResolver } from "../../api/sheet-resolver";
import { normalizeHeader } from "../../sheets";

beforeEach(() => {
  defaultSheetResolver.invalidate("id");
  defaultSheetResolver.invalidate("spreadsheet-id");
});

function createMockSheets(
  overrides: {
    getValues?: unknown[][];
    getCallCount?: { count: number };
    spreadsheetMeta?: {
      sheets: Array<{
        properties: { title: string; sheetId: number; index: number };
      }>;
    };
    batchUpdateImpl?: ReturnType<typeof mock>;
  } = {}
) {
  const batchUpdate =
    overrides.batchUpdateImpl ??
    mock(() => Promise.resolve({ data: { replies: [] } }));

  return {
    spreadsheets: {
      get: mock(() =>
        Promise.resolve({
          data: overrides.spreadsheetMeta ?? {
            sheets: [{ properties: { title: "Sheet1", sheetId: 0, index: 0 } }],
          },
        })
      ),
      batchUpdate,
      values: {
        get: mock(() => {
          if (overrides.getCallCount) {
            overrides.getCallCount.count += 1;
          }
          return Promise.resolve({
            data: {
              values: overrides.getValues ?? [["Name", "Status"]],
              range: "Sheet1!A1:B1",
            },
          });
        }),
        append: mock(() =>
          Promise.resolve({
            data: {
              updates: { updatedRange: "Sheet1!A2:B2", updatedRows: 1 },
            },
          })
        ),
        update: mock(() =>
          Promise.resolve({
            data: { updatedRange: "Sheet1!A1:B2", updatedCells: 4 },
          })
        ),
        batchUpdate: mock(() =>
          Promise.resolve({ data: { totalUpdatedCells: 2 } })
        ),
      },
    },
  };
}

describe("mvp regression scenarios", () => {
  test("normalizeHeader disambiguates headers for matching", () => {
    expect(normalizeHeader("  Task ID  ")).toBe("task id");
    expect(normalizeHeader("URL")).toBe("url");
  });

  describe("setRange dry-run", async () => {
    const { setRange } = await import("../../sheets");

    test("returns preview without API write", async () => {
      const mockSheets = createMockSheets();
      const res = await setRange(
        mockSheets as never,
        "id",
        "Sheet1!A1:B1",
        [["a", "b"]],
        { dryRun: true }
      );
      expect(res.dryRun).toBe(true);
      expect(res.updatedCells).toBe(2);
      expect(mockSheets.spreadsheets.values.update).not.toHaveBeenCalled();
    });
  });

  describe("updateByKey no match", async () => {
    const { updateByKey } = await import("../../sheets");

    test("returns zero updates when key not found", async () => {
      let callCount = 0;
      const mockSheets = createMockSheets();
      mockSheets.spreadsheets.values.get = mock(() => {
        callCount += 1;
        if (callCount === 1) {
          return Promise.resolve({
            data: { values: [["Name", "Status"]], range: "Sheet1!A1:B1" },
          });
        }
        return Promise.resolve({
          data: { values: [["missing"]], range: "Sheet1!A2:A2" },
        });
      });
      const res = await updateByKey(
        mockSheets as never,
        "id",
        "Sheet1",
        "Name",
        "Acme",
        { Status: "Done" },
        { headerRow: 1 }
      );
      expect(res.matchedRows).toBe(0);
      expect(res.updatedCells).toBe(0);
    });
  });
});
