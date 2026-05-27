# npm release

Publishes `@zahrevsky/sheets-cli` and platform binary packages to the npm registry.

## Versioning

- **Source of truth:** `npm/cli/package.json` (`version` field).
- Run `bun scripts/sync-npm-versions.ts` to copy that version to root `package.json`, all platform packages, and `optionalDependencies`.
- CLI `--version` reads root `package.json` at build time (keep root in sync before `bun run build:npm`).
- **Independent semver** from [gmickel/sheets-cli](https://github.com/gmickel/sheets-cli) (upstream was `1.0.2` in git only; not published to npm under that name). This package starts at **`1.0.0`** — first release of `@zahrevsky/sheets-cli`, not a continuation of upstream’s version counter.
- **Changelog:** when bumping the version for a release, update [`CHANGELOG.md`](../CHANGELOG.md) in the same change: move notes from `[Unreleased]` into a new `## [x.y.z] - YYYY-MM-DD` section (or add entries there), then leave `[Unreleased]` empty or with only in-flight work.

## Publishing auth (GitHub Actions)

Publishes use **npm Trusted Publisher** (OIDC) — no `NPM_TOKEN` secret.

On [npmjs.com](https://www.npmjs.com), each package under `@zahrevsky` must have a trusted publisher for this repo:

| Field | Value |
|-------|--------|
| Organization / user | `zahrevsky` |
| Repository | `sheets-cli` |
| Workflow filename | `release.yml` |
| Environment | *(empty unless you add a GitHub Environment)* |

The workflow needs `permissions.id-token: write` (see `.github/workflows/release.yml`). The publish job uses Node **24** (npm ≥ 11.5.1). `repository.url` in each `package.json` must match `https://github.com/zahrevsky/sheets-cli.git`.

After the first successful OIDC publish, you can revoke the old automation token and optionally set the package to disallow token publishes (npm → Settings → Publishing access).

## Trigger

Push a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Or run the **Release** workflow manually (`workflow_dispatch`).

## Local dry run

```bash
bun scripts/sync-npm-versions.ts
bun scripts/build-release-binaries.ts
cd npm/platforms/linux-x64 && npm pack
cd ../../cli && npm pack
```
