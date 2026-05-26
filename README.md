<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://em-content.zobj.net/source/apple/391/scroll_1f4dc.png">
    <img alt="sheets-cli" src="https://em-content.zobj.net/source/apple/391/scroll_1f4dc.png" width="96">
  </picture>
</p>

<h1 align="center">
  sheets-cli
</h1>

<p align="center">
  <strong>Composable Google Sheets primitives for humans and agents</strong>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#commands">Commands</a> •
  <a href="#for-agents">For Agents</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/bun-%23000000.svg?style=flat&logo=bun&logoColor=white" alt="Bun">
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Google%20Sheets-34A853?style=flat&logo=google-sheets&logoColor=white" alt="Google Sheets">
</p>

---

Fast, deterministic CLI for Google Sheets. Read tables, append rows, update cells by key or index, batch operations, and spreadsheet structure/formatting via `spreadsheets.batchUpdate`—all with **JSON stdout** for agents (shell only, **not** an MCP server).

```bash
# Read a sheet as structured data
sheets-cli read table --sheet "Projects" --limit 10

# Update by key column (no fragile row indices)
sheets-cli update key --sheet "Projects" --key-col "Name" --key "Acme" --set '{"Status":"Done"}'
```

<br>

> **🆕 Agent Skills** — Install as a skill for [Claude Code](https://claude.ai/code), [OpenAI Codex](https://openai.com/index/openai-codex/), or VS Code (Insiders preview; enable `chat.useAgentSkills`). The agent automatically discovers sheets-cli when you mention spreadsheets. See [For Agents](#for-agents).

<br>

## Installation

**Prerequisites:** [Bun](https://bun.sh) runtime

```bash
git clone https://github.com/zahrevsky/sheets-cli.git
cd sheets-cli
bun install
bun run build

# Binary at ./dist/sheets-cli
```

<details>
<summary><strong>Add to PATH</strong></summary>

```bash
# Symlink
ln -s "$(pwd)/dist/sheets-cli" /usr/local/bin/sheets-cli

# Or add to shell config
echo 'export PATH="$PATH:/path/to/sheets-cli/dist"' >> ~/.zshrc
```

</details>

<br>

## Quick Start

### 1. Enable APIs

1. Go to [Google Cloud Console → APIs](https://console.cloud.google.com/apis/library)
2. Enable **Google Sheets API**
3. Enable **Google Drive API** (required for `spreadsheet list` / `spreadsheet find`)

### 2. Create OAuth Credentials

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create **OAuth 2.0 Client ID** → Desktop app
3. Download the JSON file

> Desktop apps auto-allow localhost redirects. CLI captures OAuth code via `http://localhost:3847`.

### 3. Authenticate

```bash
sheets-cli auth login --credentials ./client_secret.json
```

Browser opens → authorize → done.

### 4. Set Default Spreadsheet (optional)

```bash
# Set env var to avoid passing --spreadsheet every time
export SHEETS_CLI_DEFAULT_SPREADSHEET_ID="your-spreadsheet-id"
```

Get the ID from your sheet URL: `docs.google.com/spreadsheets/d/<ID>/edit`

### 5. Use

```bash
sheets-cli spreadsheet tabs --spreadsheet <id>
sheets-cli read table --spreadsheet <id> --sheet "Sheet1" --limit 5
sheets-cli append --spreadsheet <id> --sheet "Sheet1" --values '{"Name":"New Item","Status":"Active"}'
```

<br>

## Commands

### Auth

```bash
sheets-cli auth login --credentials <file> [--token-store <path>]
sheets-cli auth status
sheets-cli auth logout
```

### Metadata

```bash
sheets-cli spreadsheet list [--name "<query>"] [--limit 100]   # Your spreadsheet files (Drive)
sheets-cli spreadsheet find --name "<query>" [--limit 10]      # Search files by name
sheets-cli spreadsheet tabs [--spreadsheet <id>]                 # Tabs inside one file
sheets-cli sheet info --sheet "<name>" [--spreadsheet <id>]
sheets-cli sheet info --gid <gid> [--spreadsheet <id>]
sheets-cli header --sheet "<name>" [--header-row 1]
```

### Read

```bash
sheets-cli read table --sheet "<name>" [--limit 500] [--range "A1:Z500"] [--raw]
sheets-cli read range --range "<sheet>!A1:Z50"
```

### Write

```bash
sheets-cli append --sheet "<name>" --values '<json>' [--value-input USER_ENTERED|RAW] [--dry-run]
sheets-cli update row --sheet "<name>" --row 12 --set '<json>' [--dry-run]
sheets-cli update key --sheet "<name>" --key-col "Col" --key "Val" --set '<json>' [--dry-run] [--allow-multi]
sheets-cli set range --range "<sheet>!M2:M2" --values '<json_2d_array>' [--dry-run]
sheets-cli batch --ops '<json>' [--dry-run]
```

<details>
<summary><strong>All flags</strong></summary>

| Flag | Description | Default |
|:-----|:------------|:--------|
| `--spreadsheet <id>` | Spreadsheet ID or full URL | env var or required |
| `--dry-run` | Preview without applying | `false` |
| `--value-input <mode>` | `USER_ENTERED` or `RAW` | `USER_ENTERED` |
| `--header-row <n>` | Header row number | Auto-detect |
| `--limit <n>` | Max rows to return | unlimited |
| `--raw` | Return unformatted values | `false` |
| `--allow-multi` | Update multiple matching rows | `false` |

</details>

<br>

## JSON Formats

### Append/Update values

```json
{"Name": "Acme Corp", "Status": "Active", "Start Date": "2025-01-15"}
```

Headerless sheets (column letters):

```json
{"A": "Acme Corp", "C": "Active"}
```

### Set range (2D array)

```json
[["Value1", "Value2"], ["Value3", "Value4"]]
```

### Batch operations

```json
[
  {"op": "append", "sheet": "Tasks", "values": {"Name": "New Task"}},
  {"op": "updateRow", "sheet": "Tasks", "row": 5, "set": {"Status": "Done"}},
  {"op": "updateKey", "sheet": "Tasks", "keyCol": "ID", "key": "TASK-123", "set": {"Status": "Active"}},
  {"op": "setRange", "range": "Tasks!A1:B1", "values": [["Col1", "Col2"]]}
]
```

<br>

## Output Format

All commands return JSON to stdout:

```json
{
  "ok": true,
  "cmd": "read table",
  "spreadsheetId": "1abc...",
  "sheet": "Projects",
  "result": {
    "headers": ["Name", "Status", "Date"],
    "rows": [{"Name": "Alpha", "Status": "Active", "Date": "2025-01-15"}],
    "headerRow": 1
  }
}
```

**Errors:**

```json
{
  "ok": false,
  "cmd": "update key",
  "error": {"code": "VALIDATION_ERROR", "message": "...", "details": {}}
}
```

### Exit Codes

| Code | Meaning |
|:-----|:--------|
| `0` | Success |
| `10` | Validation error |
| `20` | Auth error |
| `30` | Permission error |
| `40` | API/transient error |

<br>

## For Agents

**Console + JSON only.** Agents should run `sheets-cli` in the shell and parse stdout. We do not ship an MCP server. See [docs/agent-contract.md](docs/agent-contract.md) and [docs/instructions.md](docs/instructions.md).

### Install Skill

```bash
# Claude Code
sheets-cli install-skill           # Project: ./.claude/skills/sheets-cli/SKILL.md
sheets-cli install-skill --global  # Personal: ~/.claude/skills/sheets-cli/SKILL.md

# OpenAI Codex
sheets-cli install-skill --codex   # ~/.codex/skills/sheets-cli/SKILL.md
```

Installs an [Agent Skill](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/overview) that teaches the agent how to use sheets-cli. After installing, the agent automatically discovers sheets-cli when you mention spreadsheets, Google Sheets, or sheet names.

> **Codex**: Requires `skills = true` in `~/.codex/config.toml` under `[features]`.
> **VS Code**: Agent Skills support is in preview and only available in VS Code Insiders. Enable `chat.useAgentSkills` to use Agent Skills.

**Restart the agent** after installing to load the skill.

### Workflow Pattern

Follow **read → decide → dry-run → apply**:

```bash
# 1. Understand current state
sheets-cli read table --sheet "Tasks" --limit 100

# 2. Dry-run
sheets-cli update key --sheet "Tasks" --key-col "ID" --key "TASK-42" --set '{"Status":"Complete"}' --dry-run

# 3. Apply
sheets-cli update key --sheet "Tasks" --key-col "ID" --key "TASK-42" --set '{"Status":"Complete"}'
```

### Best Practices

1. **Use `spreadsheet find`** to get spreadsheet ID from name
2. **Prefer key-based updates** over row indices—rows shift on insert/delete
3. **Always dry-run** before writes
4. **Check `ok` field** before proceeding
5. **Batch related operations** for atomicity
6. **Column names match case-insensitively** with normalized whitespace
7. **Header row auto-detects**—skips empty rows to find first row with data
8. **Headerless sheets:** `read table` returns columns as `A`, `B`, ...; use column letters for `--set` / `--key-col`
9. **Empty sheets:** `append` can bootstrap by writing a header row from JSON keys
10. **`read table --range`** accepts `A1:Z` (auto-prefixed with the sheet)
11. **`--spreadsheet` accepts URLs**—paste full Google Sheets URL directly

<br>

## Development

```bash
bun run dev          # Hot-reload
bun run build        # Compile binary
bun run typecheck    # Type check
bun run lint         # Lint
bun run test         # Tests
```

See [docs/testing.md](docs/testing.md) for regression and optional integration tests.

<br>

## Acknowledgements

Fork of [gmickel/sheets-cli](https://github.com/gmickel/sheets-cli). This repository adds `spreadsheets.batchUpdate` coverage, agent-focused docs, and expanded CLI commands.

<br>

## License

MIT — see [LICENSE](LICENSE) and [NOTICE](NOTICE).

---

<p align="center">
  <sub>Built with <a href="https://bun.sh">Bun</a> • Styled for machines and humans alike</sub>
</p>
