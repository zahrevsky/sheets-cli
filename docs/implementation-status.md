# Implementation status (plan phases)

| Phase | Goal | Status |
|-------|------|--------|
| 0 | Agent contract, fork hygiene, CI, regression tests, batch foundation | Done |
| B | MVP writes via `spreadsheets.batchUpdate` | Done |
| C | All ~70 Request kinds: builders + CLI surface | Partial — dedicated CLI for common ops; `request run` + `batch-raw` for any kind |
| D | Read optimization (`values.batchGet`) | Helper exists; not wired to all read paths |
| Batch coalescing | `batch --ops` → one HTTP `batchUpdate` where possible | Done |
| Parity (values vs batch) | Temporary migration checks | Skipped (mvp-scenarios instead) |
| CI integration | Live API in GitHub Actions | Optional job when repo secrets are set |

## CLI surfaces

- **High-level table ops:** `append`, `update row|key`, `set range`, `read`, `batch --ops` (coalesced writes + optional `request` op in JSON).
- **Structure / format:** `sheet`, `format`, `merge`, `unmerge`, `find-replace`, `dimension`, `sort`, `validate`, `protect`, `named-range`, `paste`, `autoresize`, `borders`.
- **Any API subrequest:** `request run --kind <kind> --body '<json>'`, `batch-raw --requests '<json>'`.

See [coverage-matrix.md](./coverage-matrix.md) for per-request mapping.
