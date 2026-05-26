import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  defaultGoogleapisSheetsV4Path,
  diffRequestKindRegistries,
  extractBatchUpdateRequestKindsFromDts,
} from "../../api/googleapis-request-kinds";
import { BATCH_UPDATE_REQUEST_KINDS } from "../../api/request-types";

describe("googleapis API coupling", () => {
  test("registry matches installed googleapis Schema$Request keys", () => {
    const fromGoogle = extractBatchUpdateRequestKindsFromDts();
    const { missing, extra } = diffRequestKindRegistries(
      BATCH_UPDATE_REQUEST_KINDS,
      fromGoogle
    );
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
    expect(fromGoogle).toHaveLength(BATCH_UPDATE_REQUEST_KINDS.length);
  });

  test("googleapis package version is recorded for drift debugging", () => {
    const pkg = JSON.parse(
      readFileSync(join(import.meta.dir, "../../../package.json"), "utf8")
    ) as { dependencies?: { googleapis?: string } };
    expect(pkg.dependencies?.googleapis).toBeDefined();
  });

  test("sheets v4.d.ts exists at expected path", () => {
    const path = defaultGoogleapisSheetsV4Path();
    expect(readFileSync(path, "utf8")).toContain(
      "export interface Schema$Request"
    );
  });
});
