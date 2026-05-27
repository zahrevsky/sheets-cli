#!/usr/bin/env bun
/**
 * Compare upstream main to the last recorded SHA in .github/upstream-last-seen.sha
 * Used by .github/workflows/upstream-watch.yml (stdout is JSON for Actions).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const UPSTREAM_BRANCH = "main";
export const UPSTREAM_REPOSITORY_FILE = ".github/upstream-repository";

const UPSTREAM_REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const GITHUB_HTTPS_REMOTE_PATTERN =
  /^https?:\/\/(?:[^@/]+@)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i;
const GITHUB_SSH_REMOTE_PATTERN =
  /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i;

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
  | { status: "bootstrap"; upstreamHead: string; upstreamRepository: string }
  | {
      status: "unchanged";
      upstreamHead: string;
      lastSeen: string;
      upstreamRepository: string;
    }
  | {
      status: "updates";
      upstreamHead: string;
      lastSeen: string;
      upstreamRepository: string;
      commits: UpstreamCommit[];
    };

export type ResolvedUpstream = {
  repository: string;
  source:
    | "env"
    | "github-fork-parent"
    | "git-remote-upstream"
    | "upstream-repository-file";
};

export function normalizeUpstreamRepository(value: string): string {
  const trimmed = value.trim();
  if (!UPSTREAM_REPOSITORY_PATTERN.test(trimmed)) {
    throw new Error(
      `Invalid upstream repository "${value}" (expected owner/name)`
    );
  }
  return trimmed;
}

export function parseGithubRemoteUrl(url: string): string | null {
  const trimmed = url.trim();
  const httpsMatch = trimmed.match(GITHUB_HTTPS_REMOTE_PATTERN);
  if (httpsMatch?.[1] && httpsMatch[2]) {
    return normalizeUpstreamRepository(`${httpsMatch[1]}/${httpsMatch[2]}`);
  }
  const sshMatch = trimmed.match(GITHUB_SSH_REMOTE_PATTERN);
  if (sshMatch?.[1] && sshMatch[2]) {
    return normalizeUpstreamRepository(`${sshMatch[1]}/${sshMatch[2]}`);
  }
  return null;
}

export function readUpstreamRepositoryFile(
  path = join(ROOT, UPSTREAM_REPOSITORY_FILE)
): string | null {
  try {
    const raw = readFileSync(path, "utf8").trim();
    return raw.length > 0 ? normalizeUpstreamRepository(raw) : null;
  } catch {
    return null;
  }
}

export async function fetchGithubForkParent(
  githubRepository: string,
  token: string
): Promise<string | null> {
  const response = await fetch(
    `https://api.github.com/repos/${githubRepository}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { parent?: { full_name?: string } };
  const parent = data.parent?.full_name;
  return parent ? normalizeUpstreamRepository(parent) : null;
}

export async function resolveUpstreamRepository(options?: {
  envRepository?: string;
  gitUpstreamUrl?: string | null;
  fileRepository?: string | null;
  githubRepository?: string;
  githubToken?: string;
}): Promise<ResolvedUpstream> {
  const envRepository =
    options?.envRepository ?? process.env.UPSTREAM_REPOSITORY;
  if (envRepository?.trim()) {
    return {
      repository: normalizeUpstreamRepository(envRepository),
      source: "env",
    };
  }

  if (options?.githubRepository && options.githubToken) {
    const parent = await fetchGithubForkParent(
      options.githubRepository,
      options.githubToken
    );
    if (parent) {
      return { repository: parent, source: "github-fork-parent" };
    }
  }

  const gitUrl = options?.gitUpstreamUrl;
  if (gitUrl) {
    const parsed = parseGithubRemoteUrl(gitUrl);
    if (parsed) {
      return { repository: parsed, source: "git-remote-upstream" };
    }
  }

  const fromFile = options?.fileRepository ?? readUpstreamRepositoryFile();
  if (fromFile) {
    return { repository: fromFile, source: "upstream-repository-file" };
  }

  throw new Error(
    "Could not resolve upstream repository. Link the GitHub fork to its parent, add git remote `upstream`, set UPSTREAM_REPOSITORY, or commit .github/upstream-repository"
  );
}

export function upstreamRemoteUrl(repository: string): string {
  return `https://github.com/${repository}.git`;
}

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

export function parseUpstreamLog(
  stdout: string,
  upstreamRepository: string
): UpstreamCommit[] {
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
    const trimmedSha = sha.trim();
    commits.push({
      sha: trimmedSha,
      author: author.trim(),
      date: date.trim(),
      subject,
      url: `https://github.com/${upstreamRepository}/commit/${trimmedSha}`,
    });
  }
  return commits;
}

export function evaluateUpstreamCheck(
  upstreamHead: string,
  lastSeen: string | null,
  commitsSinceLastSeen: UpstreamCommit[],
  upstreamRepository: string
): UpstreamCheckResult {
  const head = upstreamHead.trim();
  if (!lastSeen) {
    return { status: "bootstrap", upstreamHead: head, upstreamRepository };
  }
  if (lastSeen === head) {
    return {
      status: "unchanged",
      upstreamHead: head,
      lastSeen,
      upstreamRepository,
    };
  }
  return {
    status: "updates",
    upstreamHead: head,
    lastSeen,
    upstreamRepository,
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

export function buildCompareUrl(
  upstreamRepository: string,
  lastSeen: string,
  upstreamHead: string
): string {
  return `https://github.com/${upstreamRepository}/compare/${lastSeen}...${upstreamHead}`;
}

export function buildCursorAgentPrompt(
  forkRepository: string,
  result: Extract<UpstreamCheckResult, { status: "updates" }>
): string {
  const { upstreamRepository } = result;
  const commitsBlock = result.commits
    .map((c) => `- ${c.sha.slice(0, 7)} ${c.subject} (${c.url})`)
    .join("\n");

  return [
    `You are helping maintain the fork https://github.com/${forkRepository}.`,
    `Upstream https://github.com/${upstreamRepository} has new commits on \`${UPSTREAM_BRANCH}\` since SHA ${result.lastSeen.slice(0, 7)} (now at ${result.upstreamHead.slice(0, 7)}).`,
    "",
    "Upstream commits:",
    commitsBlock,
    "",
    "Tasks:",
    "1. Review each upstream change and compare with this fork (batchUpdate CLI, agent skills, npm binaries, expanded commands — we have diverged).",
    "2. Decide whether any upstream changes should be ported. Prefer surgical ports over merging upstream wholesale.",
    "3. If porting is worthwhile, implement on a branch named cursor/upstream-port-<short-topic>-fa36 and open a draft PR with rationale and test notes.",
    "4. If nothing should be ported, do not open a PR; summarize why in your final response.",
    "",
    "Run `bun test` and `bun x ultracite check` before proposing a PR.",
  ].join("\n");
}

export function buildUpstreamWebhookPayload(
  forkRepository: string,
  result: Extract<UpstreamCheckResult, { status: "updates" }>
): Record<string, unknown> {
  return {
    event: "upstream_updates",
    fork: {
      repository: forkRepository,
      url: `https://github.com/${forkRepository}`,
    },
    upstream: {
      repository: result.upstreamRepository,
      branch: UPSTREAM_BRANCH,
      headSha: result.upstreamHead,
      lastSeenSha: result.lastSeen,
      url: `https://github.com/${result.upstreamRepository}`,
      compareUrl: buildCompareUrl(
        result.upstreamRepository,
        result.lastSeen,
        result.upstreamHead
      ),
    },
    commits: result.commits,
    prompt: buildCursorAgentPrompt(forkRepository, result),
  };
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

async function tryGitUpstreamUrl(): Promise<string | null> {
  try {
    return await git(["remote", "get-url", "upstream"]);
  } catch {
    return null;
  }
}

function readResultFromFile(path: string): UpstreamCheckResult {
  return JSON.parse(readFileSync(path, "utf8")) as UpstreamCheckResult;
}

async function resolveForRun(): Promise<ResolvedUpstream> {
  return resolveUpstreamRepository({
    envRepository: process.env.UPSTREAM_REPOSITORY,
    gitUpstreamUrl: await tryGitUpstreamUrl(),
    fileRepository: readUpstreamRepositoryFile(),
    githubRepository: process.env.GITHUB_REPOSITORY,
    githubToken: process.env.GITHUB_TOKEN,
  });
}

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "check";
  const branch = process.env.UPSTREAM_BRANCH ?? UPSTREAM_BRANCH;
  const remoteRef = process.env.UPSTREAM_FETCH_REF ?? "upstream/main";

  if (mode === "resolve") {
    const resolved = await resolveForRun();
    console.log(JSON.stringify(resolved));
    return;
  }

  const { repository: upstreamRepository } = await resolveForRun();
  const forkRepository =
    process.env.GITHUB_REPOSITORY ??
    process.env.FORK_REPOSITORY ??
    "unknown/unknown";

  if (mode === "webhook-payload") {
    const resultPath = process.argv[3];
    if (!resultPath) {
      throw new Error(
        "Usage: check-upstream-sync.ts webhook-payload <result.json>"
      );
    }
    const result = readResultFromFile(resultPath);
    if (result.status !== "updates") {
      throw new Error(`Expected status "updates", got "${result.status}"`);
    }
    console.log(
      JSON.stringify(buildUpstreamWebhookPayload(forkRepository, result))
    );
    return;
  }

  if (mode === "fetch") {
    await git([
      "fetch",
      "--quiet",
      upstreamRemoteUrl(upstreamRepository),
      `${branch}:refs/remotes/upstream/${branch}`,
    ]);
    process.stdout.write(
      `${await git(["rev-parse", `refs/remotes/upstream/${branch}`])}\n`
    );
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
        upstreamRepository,
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
    commitsSince = parseUpstreamLog(log, upstreamRepository);
  }

  const result = evaluateUpstreamCheck(
    upstreamHead,
    lastSeen,
    commitsSince,
    upstreamRepository
  );
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
