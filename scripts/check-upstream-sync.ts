#!/usr/bin/env bun
/**
 * Compare upstream gmickel/sheets-cli main to the last recorded SHA.
 * Used by .github/workflows/upstream-watch.yml (stdout is JSON for Actions).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const UPSTREAM_REPO = "gmickel/sheets-cli";
export const UPSTREAM_BRANCH = "main";
export const UPSTREAM_REMOTE_URL = `https://github.com/${UPSTREAM_REPO}.git`;

const ROOT = join(import.meta.dir, "..");
export const LAST_SEEN_PATH = join(ROOT, ".github/upstream-last-seen.sha");

export type UpstreamCommit = {
  sha: string;
  subject: string;
  author: string;
  date: string;
  url: string;
};

export type UpstreamCheckResult =
  | { status: "bootstrap"; upstreamHead: string }
  | { status: "unchanged"; upstreamHead: string; lastSeen: string }
  | {
      status: "updates";
      upstreamHead: string;
      lastSeen: string;
      commits: UpstreamCommit[];
    };

export function readLastSeenSha(path = LAST_SEEN_PATH): string | null {
  try {
    const raw = readFileSync(path, "utf8").trim();
    return raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function writeLastSeenSha(sha: string, path = LAST_SEEN_PATH): void {
  writeFileSync(path, `${sha.trim()}\n`, "utf8");
}

export function parseUpstreamLog(stdout: string): UpstreamCommit[] {
  const commits: UpstreamCommit[] = [];
  for (const line of stdout.split("\n")) {
    if (!line.trim()) {
      continue;
    }
    const [sha, author, date, ...subjectParts] = line.split("\t");
    if (!(sha && author && date)) {
      continue;
    }
    const subject = subjectParts.join("\t").trim();
    commits.push({
      sha: sha.trim(),
      author: author.trim(),
      date: date.trim(),
      subject,
      url: `https://github.com/${UPSTREAM_REPO}/commit/${sha.trim()}`,
    });
  }
  return commits;
}

export function evaluateUpstreamCheck(
  upstreamHead: string,
  lastSeen: string | null,
  commitsSinceLastSeen: UpstreamCommit[]
): UpstreamCheckResult {
  const head = upstreamHead.trim();
  if (!lastSeen) {
    return { status: "bootstrap", upstreamHead: head };
  }
  if (lastSeen === head) {
    return { status: "unchanged", upstreamHead: head, lastSeen };
  }
  return {
    status: "updates",
    upstreamHead: head,
    lastSeen,
    commits: commitsSinceLastSeen,
  };
}

export function formatCommitsMarkdown(commits: UpstreamCommit[]): string {
  if (commits.length === 0) {
    return "_No commit messages parsed (upstream may have been force-pushed)._";
  }
  return commits
    .map(
      (c) =>
        `- [\`${c.sha.slice(0, 7)}\`](${c.url}) ${c.subject} — ${c.author} (${c.date})`
    )
    .join("\n");
}

export function buildIssueBody(
  result: Extract<UpstreamCheckResult, { status: "updates" }>
): string {
  const shortHead = result.upstreamHead.slice(0, 7);
  const compareUrl = `https://github.com/${UPSTREAM_REPO}/compare/${result.lastSeen}...${result.upstreamHead}`;

  return [
    `Upstream [${UPSTREAM_REPO}](https://github.com/${UPSTREAM_REPO}) \`main\` has new commits (HEAD \`${shortHead}\`).`,
    "",
    "## Commits",
    "",
    formatCommitsMarkdown(result.commits),
    "",
    "## What to do",
    "",
    "- Review whether any changes should be ported to this fork.",
    "- Optional: re-run **Upstream watch** with *trigger_cursor_agent* (requires `CURSOR_API_KEY`).",
    "- Close this issue after triage, even if no port is needed.",
    "",
    `[Compare on GitHub](${compareUrl})`,
  ].join("\n");
}

export function buildCursorAgentPrompt(
  result: Extract<UpstreamCheckResult, { status: "updates" }>
): string {
  const commitsBlock = result.commits
    .map((c) => `- ${c.sha.slice(0, 7)} ${c.subject} (${c.url})`)
    .join("\n");

  return [
    "You are helping maintain the fork https://github.com/zahrevsky/sheets-cli.",
    `Upstream https://github.com/${UPSTREAM_REPO} has new commits on \`${UPSTREAM_BRANCH}\` since SHA ${result.lastSeen.slice(0, 7)} (now at ${result.upstreamHead.slice(0, 7)}).`,
    "",
    "Upstream commits:",
    commitsBlock,
    "",
    "Tasks:",
    "1. Review each upstream change and compare with this fork (batchUpdate CLI, agent skills, npm binaries, expanded commands — we have diverged).",
    "2. Decide whether any upstream changes should be ported. Prefer surgical ports over merging upstream wholesale.",
    "3. If porting is worthwhile, implement on a branch named cursor/upstream-port-<short-topic>-fa36 and open a draft PR with rationale and test notes.",
    "4. If nothing should be ported, do not open a PR; instead summarize your reasoning so a maintainer can close the tracking issue.",
    "",
    "Run `bun test` and `bun x ultracite check` before proposing a PR.",
  ].join("\n");
}

async function git(args: string[]): Promise<string> {
  const proc = Bun.spawn(["git", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed (${exitCode}): ${stderr || stdout}`
    );
  }
  return stdout.trim();
}

function readResultFromEnvOrFile(): UpstreamCheckResult {
  const raw =
    process.env.UPSTREAM_CHECK_RESULT ??
    (process.argv[3]
      ? readFileSync(process.argv[3], "utf8")
      : readFileSync(0, "utf8"));
  return JSON.parse(raw) as UpstreamCheckResult;
}

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "check";
  const remoteRef = process.env.UPSTREAM_FETCH_REF ?? "upstream/main";

  if (mode === "issue-body" || mode === "cursor-prompt") {
    const result = readResultFromEnvOrFile();
    if (result.status !== "updates") {
      throw new Error(`Expected status "updates", got "${result.status}"`);
    }
    const text =
      mode === "issue-body"
        ? buildIssueBody(result)
        : buildCursorAgentPrompt(result);
    process.stdout.write(`${text}\n`);
    return;
  }

  if (mode === "fetch") {
    await git(["fetch", "--quiet", UPSTREAM_REMOTE_URL, UPSTREAM_BRANCH]);
    process.stdout.write(`${await git(["rev-parse", remoteRef])}\n`);
    return;
  }

  const upstreamHead =
    process.env.UPSTREAM_HEAD ?? (await git(["rev-parse", remoteRef]));
  const lastSeen = readLastSeenSha();

  if (mode === "bootstrap") {
    writeLastSeenSha(upstreamHead);
    console.log(
      JSON.stringify({
        status: "bootstrap",
        upstreamHead,
      } satisfies UpstreamCheckResult)
    );
    return;
  }

  let commitsSince: UpstreamCommit[] = [];
  if (lastSeen && lastSeen !== upstreamHead) {
    const log = await git([
      "log",
      `${lastSeen}..${upstreamHead}`,
      "--format=%H%x09%an%x09%ad%x09%s",
      "--date=short",
    ]).catch(() => "");
    commitsSince = parseUpstreamLog(log);
  }

  const result = evaluateUpstreamCheck(upstreamHead, lastSeen, commitsSince);
  console.log(JSON.stringify(result));

  if (mode === "write-last-seen" && result.status === "updates") {
    writeLastSeenSha(upstreamHead);
  }
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
