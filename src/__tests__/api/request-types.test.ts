import { describe, expect, test } from "bun:test";
import { BATCH_UPDATE_REQUEST_KINDS } from "../../api/request-types";

describe("request types registry", () => {
  test("includes core sheet and cell kinds", () => {
    expect(BATCH_UPDATE_REQUEST_KINDS).toContain("updateCells");
    expect(BATCH_UPDATE_REQUEST_KINDS).toContain("appendCells");
    expect(BATCH_UPDATE_REQUEST_KINDS).toContain("addSheet");
    expect(BATCH_UPDATE_REQUEST_KINDS).toContain("addConditionalFormatRule");
  });

  test("has full API surface", () => {
    expect(BATCH_UPDATE_REQUEST_KINDS.length).toBeGreaterThanOrEqual(55);
  });
});
