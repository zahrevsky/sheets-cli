# npm release

Publishes `@zahrevsky/sheets-cli` and platform binary packages to the npm registry.

## Versioning

- **Source of truth:** `npm/cli/package.json` (`version` field).
- Run `bun scripts/sync-npm-versions.ts` to copy that version to root `package.json`, all platform packages, and `optionalDependencies`.
- CLI `--version` reads root `package.json` at build time (keep root in sync before `bun run build:npm`).
- **Independent semver** from [gmickel/sheets-cli](https://github.com/gmickel/sheets-cli) (upstream was `1.0.2` in git only; not published to npm under that name). This package starts at **`1.0.0`** — first release of `@zahrevsky/sheets-cli`, not a continuation of upstream’s version counter.

## Secrets (GitHub Actions)

| Secret | Purpose |
|--------|---------|
| `NPM_TOKEN` | npm automation token with publish access to `@zahrevsky` |

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
