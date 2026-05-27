import { describe, expect, test } from "bun:test";
import {
  buildCursorAgentPrompt,
  buildIssueBody,
  evaluateUpstreamCheck,
  formatCommitsMarkdown,
  parseUpstreamLog,
} from "../../../scripts/check-upstream-sync";

describe("check-upstream-sync", () => {
  test("parseUpstreamLog parses git log format", () => {
    const commits = parseUpstreamLog(
      "abc1234\tAlice\t2026-05-27\tfix: something\n" +
        "def5678\tBob\t2026-05-26\tfeat: other"
    );
    expect(commits).toHaveLength(2);
    expect(commits[0]?.sha).toBe("abc1234");
    expect(commits[0]?.subject).toBe("fix: something");
    expect(commits[0]?.url).toContain("abc1234");
  });

  test("evaluateUpstreamCheck bootstrap when no last seen", () => {
    expect(evaluateUpstreamCheck("headsha", null, [])).toEqual({
      status: "bootstrap",
      upstreamHead: "headsha",
    });
  });

  test("evaluateUpstreamCheck unchanged", () => {
    expect(evaluateUpstreamCheck("same", "same", [])).toEqual({
      status: "unchanged",
      upstreamHead: "same",
      lastSeen: "same",
    });
  });

  test("evaluateUpstreamCheck reports updates", () => {
    const commits = [
      {
        sha: "new1111",
        subject: "fix",
        author: "a",
        date: "2026-05-27",
        url: "https://example.com",
      },
    ];
    expect(evaluateUpstreamCheck("new1111", "old0000", commits)).toEqual({
      status: "updates",
      upstreamHead: "new1111",
      lastSeen: "old0000",
      commits,
    });
  });

  test("formatCommitsMarkdown renders list", () => {
    const md = formatCommitsMarkdown([
      {
        sha: "abc1234567890",
        subject: "fix things",
        author: "Alice",
        date: "2026-05-27",
        url: "https://github.com/gmickel/sheets-cli/commit/abc1234567890",
      },
    ]);
    expect(md).toContain("abc1234");
    expect(md).toContain("fix things");
  });

  test("buildIssueBody includes compare link", () => {
    const body = buildIssueBody({
      status: "updates",
      upstreamHead: "new1111111111111111111111111111111111111111",
      lastSeen: "old0000000000000000000000000000000000000000",
      commits: [],
    });
    expect(body).toContain("compare/old0000");
    expect(body).toContain("gmickel/sheets-cli");
  });

  test("buildCursorAgentPrompt mentions fork and upstream", () => {
    const prompt = buildCursorAgentPrompt({
      status: "updates",
      upstreamHead: "new1111111111111111111111111111111111111111",
      lastSeen: "old0000000000000000000000000000000000000000",
      commits: [
        {
          sha: "new1111111111111111111111111111111111111111",
          subject: "docs: example",
          author: "a",
          date: "2026-05-27",
          url: "https://github.com/gmickel/sheets-cli/commit/new1111",
        },
      ],
    });
    expect(prompt).toContain("zahrevsky/sheets-cli");
    expect(prompt).toContain("gmickel/sheets-cli");
    expect(prompt).toContain("docs: example");
  });
});
