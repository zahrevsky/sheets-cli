# Automation

This repository uses lightweight automation instead of live Google API integration tests for dependency and upstream monitoring.

## Google APIs (`googleapis`)

| Mechanism | What it does |
|-----------|----------------|
| [Dependabot](https://docs.github.com/en/code-security/dependabot) (`.github/dependabot.yml`) | Daily check for newer `googleapis` and related packages; opens PRs for review (no auto-merge). |
| [googleapis-health workflow](../.github/workflows/googleapis-health.yml) | Daily run of `googleapis-sync` unit tests (registry vs installed types) and a registry version note in the job summary. |

After merging a `googleapis` bump:

```bash
bun install
bun scripts/generate-request-kinds.ts
bun test
bun x ultracite check
```

Live Sheets integration tests remain optional (`SHEETS_CLI_INTEGRATION=1`) and are not required for version monitoring.

## Upstream fork (`gmickel/sheets-cli`)

| Mechanism | What it does |
|-----------|----------------|
| [upstream-watch workflow](../.github/workflows/upstream-watch.yml) | Daily fetch of upstream `main`, compare to `.github/upstream-last-seen.sha`, open a labeled issue when new commits appear. |
| Optional `CURSOR_API_KEY` secret | Starts a [Cursor Cloud Agent](https://cursor.com/docs/cloud-agent/api/endpoints) to analyze upstream commits and open a PR only if porting makes sense (`autoCreatePR` is off). |

### Setup

1. **Issues only (default)** — no secrets required; triage from GitHub issues labeled `upstream-sync`.
2. **Cursor agent on new upstream commits** — in the repo’s GitHub **Settings → Secrets → Actions**, add `CURSOR_API_KEY` using a **Cloud Agents** API key from [Cursor Dashboard → Integrations](https://cursor.com/dashboard?tab=integrations) (not the generic API key used for other endpoints).
3. **Manual agent run** — Actions → **Upstream watch** → **Run workflow** → enable **trigger_cursor_agent** (still requires `CURSOR_API_KEY`).

Alternatively, configure a scheduled [Cursor Automation](https://cursor.com/docs/cloud-agent/automations) in the Cursor dashboard (cron + repository) with similar prompt text.

### Pointer file

`.github/upstream-last-seen.sha` stores the last upstream `main` commit we already notified about. The workflow updates it after creating an issue so you are not spammed for the same upstream range.
