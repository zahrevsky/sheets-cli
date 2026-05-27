#!/usr/bin/env node
"use strict";
const { execSync, spawnSync } = require("node:child_process");
const path = require("node:path");
const { platform, arch, env } = process;

function isMusl() {
  try {
    const stderr = execSync("ldd --version", {
      stdio: ["pipe", "pipe", "pipe"],
    });
    return stderr.toString().includes("musl");
  } catch (error) {
    const stderr = error.stderr;
    if (stderr === null || stderr === undefined) {
      return false;
    }
    return stderr.toString().includes("musl");
  }
}

const PLATFORMS = {
  win32: {
    x64: "@zahrevsky/sheets-cli-win32-x64/bin/sheets-cli.exe",
    arm64: "@zahrevsky/sheets-cli-win32-arm64/bin/sheets-cli.exe",
  },
  darwin: {
    x64: "@zahrevsky/sheets-cli-darwin-x64/bin/sheets-cli",
    arm64: "@zahrevsky/sheets-cli-darwin-arm64/bin/sheets-cli",
  },
  linux: {
    x64: "@zahrevsky/sheets-cli-linux-x64/bin/sheets-cli",
    arm64: "@zahrevsky/sheets-cli-linux-arm64/bin/sheets-cli",
  },
  "linux-musl": {
    x64: "@zahrevsky/sheets-cli-linux-x64-musl/bin/sheets-cli",
    arm64: "@zahrevsky/sheets-cli-linux-arm64-musl/bin/sheets-cli",
  },
};

const binPath =
  env.SHEETS_CLI_BINARY ??
  (platform === "linux" && isMusl()
    ? PLATFORMS["linux-musl"]?.[arch]
    : PLATFORMS[platform]?.[arch]);

if (!binPath) {
  console.error(
    `sheets-cli: no prebuilt binary for ${platform}-${arch}.\n` +
      "Install from source: https://github.com/zahrevsky/sheets-cli#building-from-source"
  );
  process.exit(1);
}

let executablePath;
try {
  const cliPackageJson = require.resolve("@zahrevsky/sheets-cli/package.json");
  const cliRootDir = path.dirname(cliPackageJson);
  executablePath = require.resolve(binPath, { paths: [cliRootDir] });
} catch {
  console.error(
    `sheets-cli: prebuilt binary package is not installed for ${platform}-${arch}.\n` +
      "Your OS/CPU may be unsupported, or the install did not finish correctly.\n" +
      "Try: npm install -g @zahrevsky/sheets-cli@latest\n" +
      "Or build from source: https://github.com/zahrevsky/sheets-cli#building-from-source"
  );
  process.exit(1);
}

const result = spawnSync(executablePath, process.argv.slice(2), {
  stdio: "inherit",
  env,
});

if (result.error) {
  console.error(`sheets-cli: failed to run binary: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
