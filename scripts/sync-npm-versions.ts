import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  NPM_CLI_PACKAGE,
  platformPackageDir,
  platformPackageName,
  RELEASE_TARGETS,
} from "./release-targets.ts";

const root = join(import.meta.dir, "..");
const cliPackagePath = join(root, "npm", "cli", "package.json");
const cliPackage = JSON.parse(readFileSync(cliPackagePath, "utf8")) as {
  version: string;
  optionalDependencies?: Record<string, string>;
};
const version = cliPackage.version;

const optionalDependencies: Record<string, string> = {};
for (const target of RELEASE_TARGETS) {
  optionalDependencies[platformPackageName(target.packageSuffix)] = version;
}
cliPackage.optionalDependencies = optionalDependencies;
writeFileSync(cliPackagePath, `${JSON.stringify(cliPackage, null, 2)}\n`);

for (const target of RELEASE_TARGETS) {
  const packagePath = join(
    root,
    platformPackageDir(target.packageSuffix),
    "package.json"
  );
  const pkg = JSON.parse(readFileSync(packagePath, "utf8")) as {
    version: string;
  };
  pkg.version = version;
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

const rootPackagePath = join(root, "package.json");
const rootPackage = JSON.parse(readFileSync(rootPackagePath, "utf8")) as {
  version: string;
};
rootPackage.version = version;
writeFileSync(rootPackagePath, `${JSON.stringify(rootPackage, null, 2)}\n`);

console.log(`Synced npm packages to version ${version} (${NPM_CLI_PACKAGE})`);
