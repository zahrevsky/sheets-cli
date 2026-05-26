# Agent contract (JSON stdout)

sheets-cli is a **console tool for agents**. Invoke via shell; parse **stdout as JSON**. We do **not** provide or require an MCP server.

## Success

```json
{
  "ok": true,
  "cmd": "read table",
  "spreadsheetId": "optional",
  "sheet": "optional",
  "result": {}
}
```

- `result` shape depends on `cmd`. New fields may be added; existing fields are not removed without a major version bump.
- With `--dry-run` on write commands, `result` includes a preview (e.g. planned ranges or `requests` for batch operations).

## Error

```json
{
  "ok": false,
  "cmd": "update key",
  "error": {
    "code": "VALIDATION_ERROR | AUTH_ERROR | PERMISSION_ERROR | API_ERROR",
    "message": "human-readable",
    "details": {}
  }
}
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 10 | Validation |
| 20 | Auth |
| 30 | Permission |
| 40 | API / transient |

## stderr

Reserved for rare diagnostics. Agents should rely on **stdout JSON** and exit code.
