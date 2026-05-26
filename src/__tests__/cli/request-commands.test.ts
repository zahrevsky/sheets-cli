import { describe, expect, test } from "bun:test";
import {
  buildRequestFromKind,
  isBatchUpdateRequestKind,
} from "../../cli/request-commands";

describe("request commands", () => {
  test("isBatchUpdateRequestKind accepts known kinds", () => {
    expect(isBatchUpdateRequestKind("mergeCells")).toBe(true);
    expect(isBatchUpdateRequestKind("notARealKind")).toBe(false);
  });

  test("buildRequestFromKind wraps body", () => {
    const req = buildRequestFromKind("sortRange", {
      range: { sheetId: 0 },
      sortSpecs: [],
    });
    expect(req.sortRange).toBeDefined();
  });
});
