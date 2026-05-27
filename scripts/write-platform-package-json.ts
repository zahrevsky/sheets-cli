import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  platformPackageDir,
  platformPackageName,
  RELEASE_TARGETS,
} from "./release-targets.ts";

const root = join(import.meta.dir, "..");
const cliVersion = JSON.parse(
  readFileSync(join(root, "npm", "cli", "package.json"), "utf8")
).version as string;

for (const target of RELEASE_TARGETS) {
  const pkg = {
    name: platformPackageName(target.packageSuffix),
    version: cliVersion,
    description: `Native sheets-cli binary (${target.packageSuffix})`,
    license: "MIT",
    author: "zahrevsky",
    repository: {
      type: "git",
      url: "https://github.com/zahrevsky/sheets-cli.git",
      directory: platformPackageDir(target.packageSuffix),
    },
    os: [...target.os],
    cpu: [...target.cpu],
    files: ["bin"],
    publishConfig: {
      access: "public",
    },
  };
  const dir = join(root, platformPackageDir(target.packageSuffix));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
}

console.log(`Wrote ${RELEASE_TARGETS.length} platform package.json files`);
