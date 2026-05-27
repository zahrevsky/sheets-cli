import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

function writeJson(filePath: string, value: unknown): void {
  writeFileSync(filePath, JSON.stringify(value, null, 2));
}

describe("npm bin wrapper", () => {
  test("resolves optional dependency under package node_modules", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "sheets-cli-npm-test-"));
    const nodeModulesDir = path.join(root, "node_modules");

    const cliPkgDir = path.join(nodeModulesDir, "@zahrevsky", "sheets-cli");
    const cliBinDir = path.join(cliPkgDir, "bin");
    const cliBinPath = path.join(cliBinDir, "sheets-cli.js");

    const platformPkgDir = path.join(
      cliPkgDir,
      "node_modules",
      "@zahrevsky",
      "sheets-cli-linux-x64"
    );
    const platformBinDir = path.join(platformPkgDir, "bin");
    const platformExePath = path.join(platformBinDir, "sheets-cli");

    mkdirSync(cliBinDir, { recursive: true });
    mkdirSync(platformBinDir, { recursive: true });

    writeJson(path.join(cliPkgDir, "package.json"), {
      name: "@zahrevsky/sheets-cli",
      version: "0.0.0-test",
      type: "commonjs",
    });
    writeJson(path.join(platformPkgDir, "package.json"), {
      name: "@zahrevsky/sheets-cli-linux-x64",
      version: "0.0.0-test",
      type: "commonjs",
    });

    const wrapperSource = `
#!/usr/bin/env node
"use strict";
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { platform, arch, env } = process;

const PLATFORMS = {
  linux: { x64: "@zahrevsky/sheets-cli-linux-x64/bin/sheets-cli" },
};

const binPath = env.SHEETS_CLI_BINARY ?? PLATFORMS[platform]?.[arch];
if (!binPath) process.exit(2);

let executablePath;
try {
  const cliPackageJson = require.resolve("@zahrevsky/sheets-cli/package.json");
  const cliRootDir = path.dirname(cliPackageJson);
  executablePath = require.resolve(binPath, { paths: [cliRootDir] });
} catch {
  process.exit(3);
}

const result = spawnSync(executablePath, process.argv.slice(2), {
  stdio: ["ignore", "pipe", "pipe"],
  env,
});
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
process.exit(result.status ?? 1);
`.trimStart();

    writeFileSync(cliBinPath, wrapperSource);
    chmodSync(cliBinPath, 0o755);

    const exeSource = "#!/usr/bin/env sh\necho 0.0.0-test\n";
    writeFileSync(platformExePath, exeSource);
    chmodSync(platformExePath, 0o755);

    const result = spawnSync("node", [cliBinPath, "--version"], {
      cwd: root,
      env: { ...process.env, NODE_PATH: nodeModulesDir },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("0.0.0-test");
  });
});
