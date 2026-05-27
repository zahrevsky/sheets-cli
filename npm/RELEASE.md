# npm release

Publishes `@zahrevsky/sheets-cli` and platform binary packages to the npm registry.

## Versioning

- **Source of truth:** `npm/cli/package.json` (`version` field).
- Run `bun scripts/sync-npm-versions.ts` to copy that version to root `package.json`, all platform packages, and `optionalDependencies`.
- CLI `--version` reads root `package.json` at build time (keep root in sync before `bun run build:npm`).
- This fork uses an independent semver line from [gmickel/sheets-cli](https://github.com/gmickel/sheets-cli); upstream was at `1.0.2` when npm distribution was added (`1.0.3` = first publishable release).

## Secrets (GitHub Actions)

| Secret | Purpose |
|--------|---------|
| `NPM_TOKEN` | npm automation token with publish access to `@zahrevsky` |

## Trigger

Push a version tag:

```bash
git tag v1.0.3
git push origin v1.0.3
```

Or run the **Release** workflow manually (`workflow_dispatch`).

## Local dry run

```bash
bun scripts/sync-npm-versions.ts
bun scripts/build-release-binaries.ts
cd npm/platforms/linux-x64 && npm pack
cd ../../cli && npm pack
```
