# Automation

## Dependencies (Dependabot)

[`.github/dependabot.yml`](../.github/dependabot.yml) runs **daily** for Bun and weekly for GitHub Actions. It opens **pull requests** for patch, minor, and **major** updates (nothing auto-merges).

After merging a `googleapis` bump:

```bash
bun install
bun scripts/generate-request-kinds.ts
bun test
bun x ultracite check
```

Update `CHANGELOG.md` under `[Unreleased]` when the release matters to users.

## Upstream repository

[`.github/workflows/upstream-watch.yml`](../.github/workflows/upstream-watch.yml) runs daily. When upstream `main` advances past [`.github/upstream-last-seen.sha`](../.github/upstream-last-seen.sha), it **POSTs JSON** to your Cursor webhook (no GitHub issues).

### Resolving which repo is “upstream”

The workflow picks the first match:

1. `UPSTREAM_REPOSITORY` env (manual override)
2. **GitHub fork parent** — if this repo is linked as a fork on GitHub (`parent.full_name` from the API)
3. **`git remote upstream`** — URL on the runner checkout (uncommon in CI, useful locally)
4. [`.github/upstream-repository`](../.github/upstream-repository) — one line `owner/name` (fallback for this repo: `gmickel/sheets-cli`)

To use fork metadata only, link the repository as a fork under **Settings** on GitHub and you can remove the file. To pin a custom upstream, keep or edit `.github/upstream-repository`.

### GitHub Actions secrets

| Secret | Value |
|--------|--------|
| `CURSOR_UPSTREAM_WEBHOOK_URL` | Full webhook URL from your Cursor automation |
| `CURSOR_UPSTREAM_WEBHOOK_BEARER` | Bearer token (workflow sends `Authorization: Bearer <token>`) |

If the URL secret is missing, the workflow still records the new upstream SHA but skips the webhook (warning in the job log).

### Webhook JSON body

```json
{
  "event": "upstream_updates",
  "fork": { "repository": "owner/fork", "url": "..." },
  "upstream": {
    "repository": "owner/upstream",
    "branch": "main",
    "headSha": "...",
    "lastSeenSha": "...",
    "compareUrl": "https://github.com/.../compare/...",
    "url": "..."
  },
  "commits": [{ "sha", "subject", "author", "date", "url" }],
  "prompt": "..."
}
```

Wire your Cursor automation to use `prompt` (and/or structured fields) as the agent task.

### Pointer file

`.github/upstream-last-seen.sha` is updated **after** a successful webhook POST so the same upstream range is not sent twice.
