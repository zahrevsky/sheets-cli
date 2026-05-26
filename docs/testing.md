# Testing

## Before every commit

```bash
bun test
bun run typecheck
bun x ultracite check
```

## Layout

| Path | Purpose |
|------|---------|
| `src/__tests__/regression/mvp-scenarios.test.ts` | High-level table ops (mocks) |
| `src/__tests__/regression/docs-sync.test.ts` | SKILL.md / README / CLI help alignment |
| `src/__tests__/regression/cli-contract.test.ts` | JSON output shape |
| `src/__tests__/fixtures/requests/` | Golden `batchUpdate` payloads |
| `src/__tests__/builders/` | Builder unit tests |
| `src/__tests__/integration/` | Live API (optional) |

## Integration (optional)

Requires valid `~/.sheets-cli/token.json` and credentials.

```bash
SHEETS_CLI_INTEGRATION=1 bun test src/__tests__/integration
```

Creates a **new** spreadsheet only; never modifies user default spreadsheets.

## Parity (phase B only)

`src/__tests__/parity/` exists only during Values→batchUpdate migration and is removed after phase B.
