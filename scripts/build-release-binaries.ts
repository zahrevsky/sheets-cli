import { chmodSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { platformPackageDir, RELEASE_TARGETS } from "./release-targets.ts";

const entrypoint = join(import.meta.dir, "..", "src", "cli.ts");
const compileFlags = [
  "--compile",
  "--no-compile-autoload-dotenv",
  "--no-compile-autoload-bunfig",
];

for (const target of RELEASE_TARGETS) {
  const outDir = join(
    import.meta.dir,
    "..",
    platformPackageDir(target.packageSuffix),
    "bin"
  );
  const outfile = join(outDir, target.exeName);
  mkdirSync(dirname(outfile), { recursive: true });

  const proc = Bun.spawnSync(
    [
      "bun",
      "build",
      entrypoint,
      ...compileFlags,
      `--target=${target.bunTarget}`,
      `--outfile=${outfile}`,
    ],
    {
      cwd: join(import.meta.dir, ".."),
      stdout: "inherit",
      stderr: "inherit",
    }
  );

  if (proc.exitCode !== 0) {
    throw new Error(
      `Failed to build ${target.packageSuffix} (${target.bunTarget})`
    );
  }

  if (!target.exeName.endsWith(".exe")) {
    chmodSync(outfile, 0o755);
  }

  console.log(`built ${target.packageSuffix} -> ${outfile}`);
}
