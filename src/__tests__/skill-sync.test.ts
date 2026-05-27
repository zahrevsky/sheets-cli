import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../..");
const SKILL_PATH = join(ROOT, "skills/sheets-cli/SKILL.md");
const SKILL_FRONTMATTER = /^---\nname: sheets-cli\n/;

function readSkillMarkdown(): string {
  return readFileSync(SKILL_PATH, "utf8");
}

describe("skill", () => {
  test("skills/sheets-cli/SKILL.md exists with required frontmatter", () => {
    const markdown = readSkillMarkdown();
    expect(markdown).toMatch(SKILL_FRONTMATTER);
    expect(markdown).toContain("description:");
  });

  test("folder name matches skill name in frontmatter", () => {
    expect(SKILL_PATH).toContain("/skills/sheets-cli/SKILL.md");
  });
});
