import { describe, expect, test } from "bun:test";
import {
  evaluateUpstreamCheck,
  parseLsRemoteHead,
} from "../../../scripts/sync-upstream-sha";

describe("sync-upstream-sha", () => {
  test("parseLsRemoteHead extracts commit sha", () => {
    expect(parseLsRemoteHead("abc123def4567890\trefs/heads/main\n")).toBe(
      "abc123def4567890"
    );
  });

  test("evaluateUpstreamCheck detects updates", () => {
    expect(
      evaluateUpstreamCheck("bbb", "aaa", "gmickel/sheets-cli", "main")
    ).toMatchObject({ status: "updates" });
    expect(
      evaluateUpstreamCheck("aaa", "aaa", "gmickel/sheets-cli", "main")
    ).toMatchObject({ status: "unchanged" });
    expect(
      evaluateUpstreamCheck("aaa", null, "gmickel/sheets-cli", "main")
    ).toMatchObject({ status: "bootstrap" });
  });
});
