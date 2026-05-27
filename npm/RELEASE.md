# npm release

Publishes `@zahrevsky/sheets-cli` and platform binary packages to the npm registry.

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
