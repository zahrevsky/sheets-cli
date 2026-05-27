export type ReleaseTarget = {
  readonly packageSuffix: string;
  readonly bunTarget: string;
  readonly os: readonly string[];
  readonly cpu: readonly string[];
  readonly exeName: string;
};

export const RELEASE_TARGETS: readonly ReleaseTarget[] = [
  {
    packageSuffix: "darwin-arm64",
    bunTarget: "bun-darwin-arm64",
    os: ["darwin"],
    cpu: ["arm64"],
    exeName: "sheets-cli",
  },
  {
    packageSuffix: "darwin-x64",
    bunTarget: "bun-darwin-x64",
    os: ["darwin"],
    cpu: ["x64"],
    exeName: "sheets-cli",
  },
  {
    packageSuffix: "linux-arm64",
    bunTarget: "bun-linux-arm64",
    os: ["linux"],
    cpu: ["arm64"],
    exeName: "sheets-cli",
  },
  {
    packageSuffix: "linux-arm64-musl",
    bunTarget: "bun-linux-arm64-musl",
    os: ["linux"],
    cpu: ["arm64"],
    exeName: "sheets-cli",
  },
  {
    packageSuffix: "linux-x64",
    bunTarget: "bun-linux-x64",
    os: ["linux"],
    cpu: ["x64"],
    exeName: "sheets-cli",
  },
  {
    packageSuffix: "linux-x64-musl",
    bunTarget: "bun-linux-x64-musl",
    os: ["linux"],
    cpu: ["x64"],
    exeName: "sheets-cli",
  },
  {
    packageSuffix: "win32-arm64",
    bunTarget: "bun-windows-arm64",
    os: ["win32"],
    cpu: ["arm64"],
    exeName: "sheets-cli.exe",
  },
  {
    packageSuffix: "win32-x64",
    bunTarget: "bun-windows-x64",
    os: ["win32"],
    cpu: ["x64"],
    exeName: "sheets-cli.exe",
  },
] as const;

export const NPM_SCOPE = "@zahrevsky";
export const NPM_CLI_PACKAGE = `${NPM_SCOPE}/sheets-cli`;

export function platformPackageName(suffix: string): string {
  return `${NPM_SCOPE}/sheets-cli-${suffix}`;
}

export function platformPackageDir(suffix: string): string {
  return `npm/platforms/${suffix}`;
}
