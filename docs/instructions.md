# sheets-cli patterns for agents

Use **shell + JSON**, not MCP. Install the skill: `sheets-cli install-skill --global`.

## Workflow

1. **Read** current state (`read table` or `read range`).
2. **Decide** what to change.
3. **Dry-run** any write (`--dry-run`).
4. **Apply** without `--dry-run`.

## Environment

- `SHEETS_CLI_DEFAULT_SPREADSHEET_ID` — default `--spreadsheet` target.
- OAuth: `sheets-cli auth login --credentials <oauth-client.json>`.

## Examples

```bash
sheets-cli read table --spreadsheet "$ID" --sheet "Tasks" --limit 100
sheets-cli update key --spreadsheet "$ID" --sheet "Tasks" \
  --key-col "ID" --key "TASK-42" --set '{"Status":"Done"}' --dry-run
sheets-cli update key --spreadsheet "$ID" --sheet "Tasks" \
  --key-col "ID" --key "TASK-42" --set '{"Status":"Done"}'
```

## Batch and advanced writes

Coalesce several table ops into one API call:

```bash
sheets-cli batch --spreadsheet "$ID" --ops '[
  {"op":"append","sheet":"Tasks","values":{"Name":"New"}},
  {"op":"setRange","range":"Tasks!B2","values":[["Ready"]]}
]' --dry-run
```

Any of the 70 `batchUpdate` request kinds:

```bash
sheets-cli request run --spreadsheet "$ID" --kind sortRange --body '{...}' --dry-run
sheets-cli batch-raw --spreadsheet "$ID" --requests '[{"mergeCells":{...}}]' --dry-run
```

See `docs/agent-contract.md` for JSON output shape.
