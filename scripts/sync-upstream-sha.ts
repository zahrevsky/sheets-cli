#!/usr/bin/env bun
/**
 * Print or write upstream default-branch HEAD to .github/upstream-last-seen.sha.
 *
 *   UPSTREAM_REPO=owner/name bun scripts/sync-upstream-sha.ts
 *   UPSTREAM_REPO=owner/name bun scripts/sync-upstream-sha.ts --write
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
export const LAST_SEEN_PATH = join(ROOT, ".github/upstream-last-seen.sha");

export function parseLsRemoteHead(stdout: string): string {
  const line = stdout.trim().split("\n")[0];
  const sha = line?.split("\t")[0]?.trim();
  if (!sha) {
    throw new Error(`Could not parse git ls-remote output: ${stdout}`);
  }
  return sha;
}

export async function fetchUpstreamHeadSha(
  repository: string,
  branch = "main"
): Promise<string> {
  const proc = Bun.spawn(
    [
      "git",
      "ls-remote",
      `https://github.com/${repository}.git`,
      `refs/heads/${branch}`,
    ],
    { stdout: "pipe", stderr: "pipe" }
  );
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) {
    throw new Error(`git ls-remote failed (${exitCode}): ${stderr || stdout}`);
  }
  return parseLsRemoteHead(stdout);
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

async function main(): Promise<void> {
  const repository = process.env.UPSTREAM_REPO?.trim();
  if (!repository) {
    throw new Error("Set UPSTREAM_REPO (owner/name)");
  }
  const branch = process.env.UPSTREAM_BRANCH?.trim() ?? "main";
  const sha = await fetchUpstreamHeadSha(repository, branch);
  const write = process.argv.includes("--write");

  if (write) {
    writeLastSeenSha(sha);
    process.stdout.write(`${sha}\n`);
    return;
  }

  const lastSeen = readLastSeenSha();
  if (lastSeen) {
    process.stderr.write(`last-seen: ${lastSeen}\n`);
  }
  process.stdout.write(`${sha}\n`);
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
