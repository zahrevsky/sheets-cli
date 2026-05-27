import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../../..");
const SKILL_PATH = join(ROOT, "skills/sheets-cli/SKILL.md");

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
];

function readRootFile(name: string): string {
  return readFileSync(join(ROOT, name), "utf8");
}

function readSkillMarkdown(): string {
  return readFileSync(SKILL_PATH, "utf8");
}

describe("docs sync", () => {
  test("skills/sheets-cli/SKILL.md exists", () => {
    const markdown = readSkillMarkdown();
    const normalize = (s: string) => s.replaceAll("\r\n", "\n").trimEnd();
    expect(normalize(markdown).length).toBeGreaterThan(100);
  });

  test("SKILL.md documents top-level commands", () => {
    const skillContent = readSkillMarkdown();
    for (const cmd of TOP_LEVEL_COMMANDS) {
      expect(skillContent).toContain(`sheets-cli ${cmd}`);
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

  test("SKILL.md mentions JSON stdout contract", () => {
    const skillContent = readSkillMarkdown();
    expect(skillContent.toLowerCase()).toContain("json");
    expect(skillContent.toLowerCase()).toContain("stdout");
  });

  test("README documents npx skills installation", () => {
    const readme = readRootFile("README.md");
    expect(readme).toContain("npx skills");
  });
});
