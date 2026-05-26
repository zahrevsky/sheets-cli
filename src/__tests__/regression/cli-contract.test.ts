import { describe, expect, test } from "bun:test";
import { error, exitCode, success } from "../../output";

describe("cli contract", () => {
  test("success shape", () => {
    const res = success(
      "read table",
      { rows: [] },
      {
        spreadsheetId: "abc",
        sheet: "Sheet1",
      }
    );
    expect(res.ok).toBe(true);
    expect(res.cmd).toBe("read table");
    expect(res.spreadsheetId).toBe("abc");
    expect(res.sheet).toBe("Sheet1");
    expect(res.result).toEqual({ rows: [] });
    expect(exitCode(res)).toBe(0);
  });

  test("error shape and exit codes", () => {
    const codes = [
      ["VALIDATION_ERROR", 10],
      ["AUTH_ERROR", 20],
      ["PERMISSION_ERROR", 30],
      ["API_ERROR", 40],
    ] as const;
    for (const [code, exit] of codes) {
      const res = error("append", code, "msg", { hint: true });
      expect(res.ok).toBe(false);
      expect(res.error.code).toBe(code);
      expect(res.error.message).toBe("msg");
      expect(res.error.details).toEqual({ hint: true });
      expect(exitCode(res)).toBe(exit);
    }
  });
});
