import { describe, expect, test } from "bun:test";
import {
  buildAddSheetRequest,
  buildHideSheetRequest,
  buildShowSheetRequest,
} from "../../builders/sheets";

describe("sheet builders", () => {
  test("addSheet", () => {
    const req = buildAddSheetRequest({ title: "NewTab" });
    expect(req.addSheet?.properties?.title).toBe("NewTab");
  });

  test("hide and show", () => {
    expect(
      buildHideSheetRequest(1).updateSheetProperties?.properties?.hidden
    ).toBe(true);
    expect(
      buildShowSheetRequest(1).updateSheetProperties?.properties?.hidden
    ).toBe(false);
  });
});
