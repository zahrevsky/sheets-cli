# Automation

## Dependencies (Dependabot)

[`.github/dependabot.yml`](../.github/dependabot.yml) runs **daily** for Bun (patch, minor, and major) and weekly for GitHub Actions. It opens pull requests for review; nothing auto-merges.

After a `googleapis` bump: `bun scripts/generate-request-kinds.ts`, `bun test`, update `CHANGELOG.md`.

## Upstream (Cursor webhook)

[`.github/workflows/upstream-watch.yml`](../.github/workflows/upstream-watch.yml) runs daily, compares upstream `main` HEAD to [`.github/upstream-last-seen.sha`](../.github/upstream-last-seen.sha), and **POSTs the Cursor webhook only when they differ**. The agent instructions live in Cursor (Automations UI), not in the workflow.

Edit upstream target in the workflow file:

```yaml
env:
  UPSTREAM_REPO: gmickel/sheets-cli
```

That variable is only noted in the job summary for humans; the webhook call itself needs **no JSON body**—only the URL and Bearer token ([Cursor webhook triggers](https://cursor.com/docs/cloud-agent/automations)).

### GitHub Actions secrets

| Secret | Value |
|--------|--------|
| `CURSOR_UPSTREAM_WEBHOOK_URL` | Webhook URL from Cursor Automations (after save) |
| `CURSOR_UPSTREAM_WEBHOOK_BEARER` | API key from **Generate auth header** in the same UI |

### Upstream SHA file (updated by the agent, not CI)

[`.github/upstream-last-seen.sha`](../.github/upstream-last-seen.sha) records the last upstream commit you have acknowledged. **CI does not bump it.**

Refresh the value locally or let the agent run:

```bash
UPSTREAM_REPO=gmickel/sheets-cli bun scripts/sync-upstream-sha.ts          # print current upstream HEAD
UPSTREAM_REPO=gmickel/sheets-cli bun scripts/sync-upstream-sha.ts --write  # overwrite the file
```

The agent can use the same script in a PR when porting (or skipping) upstream changes.
