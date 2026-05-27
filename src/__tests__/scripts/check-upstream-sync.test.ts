import { describe, expect, test } from "bun:test";
import {
  buildCursorAgentPrompt,
  buildUpstreamWebhookPayload,
  evaluateUpstreamCheck,
  formatCommitsMarkdown,
  normalizeUpstreamRepository,
  parseGithubRemoteUrl,
  parseUpstreamLog,
  readUpstreamRepositoryFile,
  resolveUpstreamRepository,
} from "../../../scripts/check-upstream-sync";

describe("check-upstream-sync", () => {
  test("parseUpstreamLog parses git log format", () => {
    const commits = parseUpstreamLog(
      "abc1234\tAlice\t2026-05-27\tfix: something\n" +
        "def5678\tBob\t2026-05-26\tfeat: other",
      "gmickel/sheets-cli"
    );
    expect(commits).toHaveLength(2);
    expect(commits[0]?.sha).toBe("abc1234");
    expect(commits[0]?.url).toContain("gmickel/sheets-cli/commit/abc1234");
  });

  test("parseGithubRemoteUrl supports https and ssh", () => {
    expect(
      parseGithubRemoteUrl("https://github.com/gmickel/sheets-cli.git")
    ).toBe("gmickel/sheets-cli");
    expect(parseGithubRemoteUrl("git@github.com:gmickel/sheets-cli.git")).toBe(
      "gmickel/sheets-cli"
    );
  });

  test("resolveUpstreamRepository prefers env then file", async () => {
    await expect(
      resolveUpstreamRepository({
        envRepository: "acme/upstream",
        fileRepository: "other/repo",
      })
    ).resolves.toEqual({ repository: "acme/upstream", source: "env" });

    await expect(
      resolveUpstreamRepository({
        gitUpstreamUrl: "https://github.com/gmickel/sheets-cli.git",
        fileRepository: "other/repo",
      })
    ).resolves.toEqual({
      repository: "gmickel/sheets-cli",
      source: "git-remote-upstream",
    });
  });

  test("readUpstreamRepositoryFile reads committed fallback", () => {
    expect(readUpstreamRepositoryFile()).toBe("gmickel/sheets-cli");
  });

  test("normalizeUpstreamRepository rejects invalid values", () => {
    expect(() => normalizeUpstreamRepository("not-a-repo")).toThrow();
  });

  test("evaluateUpstreamCheck bootstrap when no last seen", () => {
    expect(evaluateUpstreamCheck("headsha", null, [], "acme/up")).toEqual({
      status: "bootstrap",
      upstreamHead: "headsha",
      upstreamRepository: "acme/up",
    });
  });

  test("evaluateUpstreamCheck unchanged", () => {
    expect(evaluateUpstreamCheck("same", "same", [], "acme/up")).toEqual({
      status: "unchanged",
      upstreamHead: "same",
      lastSeen: "same",
      upstreamRepository: "acme/up",
    });
  });

  test("buildUpstreamWebhookPayload includes compare URL and prompt", () => {
    const result = {
      status: "updates" as const,
      upstreamHead: "new1111111111111111111111111111111111111111",
      lastSeen: "old0000000000000000000000000000000000000000",
      upstreamRepository: "gmickel/sheets-cli",
      commits: [
        {
          sha: "new1111111111111111111111111111111111111111",
          subject: "docs: example",
          author: "a",
          date: "2026-05-27",
          url: "https://github.com/gmickel/sheets-cli/commit/new1111",
        },
      ],
    };
    const payload = buildUpstreamWebhookPayload("zahrevsky/sheets-cli", result);
    expect(payload.event).toBe("upstream_updates");
    expect(payload.upstream).toMatchObject({
      repository: "gmickel/sheets-cli",
      compareUrl: expect.stringContaining("compare/old0000"),
    });
    expect(String(payload.prompt)).toContain("zahrevsky/sheets-cli");
  });

  test("buildCursorAgentPrompt mentions fork and upstream", () => {
    const prompt = buildCursorAgentPrompt("zahrevsky/sheets-cli", {
      status: "updates",
      upstreamHead: "new1111111111111111111111111111111111111111",
      lastSeen: "old0000000000000000000000000000000000000000",
      upstreamRepository: "gmickel/sheets-cli",
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
});
