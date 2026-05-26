import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REQUEST_BLOCK_START = "export interface Schema$Request {";
const REQUEST_BLOCK_END = "export interface Schema$Response {";

export function defaultGoogleapisSheetsV4Path(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(
    here,
    "../../node_modules/googleapis/build/src/apis/sheets/v4.d.ts"
  );
}

export function extractBatchUpdateRequestKindsFromDts(
  dtsPath: string = defaultGoogleapisSheetsV4Path()
): string[] {
  const source = readFileSync(dtsPath, "utf8");
  const start = source.indexOf(REQUEST_BLOCK_START);
  const end = source.indexOf(REQUEST_BLOCK_END);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `Could not locate Schema$Request in googleapis sheets v4 types: ${dtsPath}`
    );
  }
  const block = source.slice(start, end);
  const keys: string[] = [];
  for (const match of block.matchAll(/^\s+(\w+)\?:/gm)) {
    const name = match[1];
    if (name) {
      keys.push(name);
    }
  }
  if (keys.length === 0) {
    throw new Error(`No request kinds parsed from ${dtsPath}`);
  }
  return [...new Set(keys)].sort((a, b) => a.localeCompare(b));
}

export function diffRequestKindRegistries(
  registry: readonly string[],
  googleapisKinds: readonly string[]
): { missing: string[]; extra: string[] } {
  const reg = new Set(registry);
  const api = new Set(googleapisKinds);
  const missing = googleapisKinds.filter((k) => !reg.has(k));
  const extra = registry.filter((k) => !api.has(k));
  return { missing, extra };
}
