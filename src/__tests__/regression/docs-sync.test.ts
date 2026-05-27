import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SKILL_CONTENT } from "../../skill";

const ROOT = join(import.meta.dir, "../../..");

const TOP_LEVEL_COMMANDS = [
  "auth",
  "spreadsheet",
  "sheet",
  "header",
  "read",
  "append",
  "update",
  "set",
  "batch",
  "batch-raw",
  "format",
  "find-replace",
  "merge",
  "unmerge",
  "request",
  "dimension",
  "sort",
  "validate",
  "protect",
  "named-range",
  "paste",
  "autoresize",
  "borders",
  "doctor",
  "install-skill",
];

function readRootFile(name: string): string {
  return readFileSync(join(ROOT, name), "utf8");
}

describe("docs sync", () => {
  test("SKILL_CONTENT matches SKILL.md", () => {
    const markdown = readRootFile("SKILL.md");
    const normalize = (s: string) => s.replaceAll("\r\n", "\n").trimEnd();
    expect(normalize(SKILL_CONTENT)).toBe(normalize(markdown));
  });

  test("SKILL.md documents top-level commands", () => {
    for (const cmd of TOP_LEVEL_COMMANDS) {
      expect(SKILL_CONTENT).toContain(`sheets-cli ${cmd}`);
    }
  });

  test("README mentions sheets-cli and fork context", () => {
    const readme = readRootFile("README.md");
    expect(readme).toContain("sheets-cli");
    expect(readme).toContain("Acknowledgements");
  });

  test("package.json repository points to this fork", () => {
    const pkg = JSON.parse(readRootFile("package.json")) as {
      repository?: { url?: string };
    };
    expect(pkg.repository?.url).toContain("zahrevsky/sheets-cli");
  });

  test("npm/cli version matches root package.json", () => {
    const root = JSON.parse(readRootFile("package.json")) as {
      version: string;
    };
    const cli = JSON.parse(readRootFile("npm/cli/package.json")) as {
      version: string;
    };
    expect(cli.version).toBe(root.version);
  });

  test("SKILL.md mentions JSON stdout contract", () => {
    expect(SKILL_CONTENT.toLowerCase()).toContain("json");
    expect(SKILL_CONTENT.toLowerCase()).toContain("stdout");
  });
});
