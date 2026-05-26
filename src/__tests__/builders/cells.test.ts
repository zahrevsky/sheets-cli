import { describe, expect, test } from "bun:test";
import { buildUpdateCellsRequest } from "../../builders/cells";
import { parseA1RangeToGrid } from "../../builders/grid-range";

describe("buildUpdateCellsRequest", () => {
  test("builds grid update for A1:B2", () => {
    const grid = parseA1RangeToGrid("Sheet1!A1:B2", 0);
    const req = buildUpdateCellsRequest({
      range: grid,
      values: [
        ["a", "b"],
        ["c", "d"],
      ],
      valueInputOption: "USER_ENTERED",
    });
    expect(req.updateCells?.fields).toBe("userEnteredValue");
    expect(req.updateCells?.rows).toHaveLength(2);
    expect(req.updateCells?.range?.endRowIndex).toBe(2);
    expect(req.updateCells?.range?.endColumnIndex).toBe(2);
  });
});
