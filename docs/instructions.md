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

## Advanced writes

For spreadsheet structure, formatting, or API requests without a dedicated command:

```bash
sheets-cli batch raw --spreadsheet "$ID" --requests '[{"updateCells":{...}}]' --dry-run
```

See `docs/agent-contract.md` for JSON output shape.
