# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `CHANGELOG.md` and a release-process note to update it when bumping versions.
- Dependabot (daily, including major) for Bun and GitHub Actions dependencies.
- Scheduled `upstream-watch`: POST Cursor webhook (Bearer only); `UPSTREAM_REPO` in workflow env; `scripts/sync-upstream-sha.ts` for agent-driven SHA updates.
- Automation docs in README; upstream baseline SHA at fork import in `.github/upstream-last-seen.sha`.

## [1.0.3] - 2026-05-27

### Fixed

- CI: restore executable permissions on platform binaries after GitHub Actions artifact download.

## [1.0.2] - 2026-05-27

### Fixed

- npm: mark platform prebuilt binaries as executable via each platform package’s `bin` field.

## [1.0.1] - 2026-05-27

### Fixed

- npm: global install wrapper resolves the correct platform prebuilt binary path.

### Changed

- CI: publish to npm via Trusted Publisher (OIDC) instead of a long-lived automation token.
- CI: publish from the `npm/cli` package directory; skip publish when the version already exists on the registry.
- CI: correct working directory and path normalization for `npm publish` after downloading build artifacts.

## [1.0.0] - 2026-05-27

First public release of `@zahrevsky/sheets-cli` on npm. Versioning is independent of [gmickel/sheets-cli](https://github.com/gmickel/sheets-cli) (upstream had `1.0.2` in git only and was not published under that name on npm).

### Added

- Prebuilt native CLI binaries for macOS (Apple Silicon and Intel), Linux (glibc and musl/Alpine on x64 and arm64), and Windows (x64 and arm64), distributed as `@zahrevsky/sheets-cli` with per-platform optional dependencies.
- Agent skill installation via [`npx skills`](https://www.npmjs.com/package/skills) instead of a custom `install-skill` command.
- Spreadsheet metadata commands: `spreadsheet list`, `spreadsheet find`, and `spreadsheet tabs`.
- Listing all spreadsheets in Google Drive via the Drive API (`sheets spreadsheets`).
- Writes migrated to `spreadsheets.batchUpdate` with an expanded CLI surface.
- Batch `--ops` coalescing, a `request` CLI, docs sync, and optional CI integration tests.
- Request registry typed against googleapis, with CI sync and `doctor api`.
- Cursor Cloud / `AGENTS.md` guidance for mapping OAuth secrets to `~/.sheets-cli/` files.

### Changed

- **Breaking:** rename spreadsheet tab terminology to “sheets” in commands and flags; rename metadata commands to the `spreadsheet` namespace.
- **Breaking:** remove the in-repo `docs/` directory (documentation is synced/generated elsewhere).
- Enriched metadata when listing spreadsheets from Drive.
- CLI `--version` reads from `package.json` at build time.

[Unreleased]: https://github.com/zahrevsky/sheets-cli/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/zahrevsky/sheets-cli/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/zahrevsky/sheets-cli/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/zahrevsky/sheets-cli/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/zahrevsky/sheets-cli/releases/tag/v1.0.0
