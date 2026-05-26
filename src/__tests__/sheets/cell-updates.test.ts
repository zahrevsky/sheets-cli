import { describe, expect, test } from "bun:test";
import { cellUpdatesToRequests } from "../../sheets/cell-updates";

describe("cellUpdatesToRequests", () => {
  test("merges updates on the same row", () => {
    const requests = cellUpdatesToRequests(
      0,
      [
        { rowIndex: 1, colIndex: 0, value: "a" },
        { rowIndex: 1, colIndex: 2, value: "c" },
      ],
      "USER_ENTERED"
    );
    expect(requests).toHaveLength(1);
    expect(requests[0]?.updateCells).toBeDefined();
  });
});
