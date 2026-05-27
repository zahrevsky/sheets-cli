import { describe, expect, test } from "bun:test";
import { parseLsRemoteHead } from "../../../scripts/sync-upstream-sha";

describe("sync-upstream-sha", () => {
  test("parseLsRemoteHead extracts commit sha", () => {
    expect(parseLsRemoteHead("abc123def4567890\trefs/heads/main\n")).toBe(
      "abc123def4567890"
    );
  });
});
