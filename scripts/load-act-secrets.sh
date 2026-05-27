#!/usr/bin/env bash
# Emit act -s KEY=VALUE flags for integration workflows.
# GitHub Actions secrets cannot be read back via `gh` (API never returns values).
# Sources (first match wins per key): process env, then ~/.sheets-cli/*.json.
set -euo pipefail

emit_secret() {
  local name="$1"
  local value="$2"
  if [ -n "$value" ]; then
    printf '%s\n' "-s" "${name}=${value}"
  fi
}

read_file_or_empty() {
  local path="$1"
  if [ -f "$path" ]; then
    cat "$path"
  fi
}

CREDENTIALS="${SHEETS_CLI_CREDENTIALS_JSON:-}"
TOKEN="${SHEETS_CLI_TOKEN_JSON:-}"

if [ -z "$CREDENTIALS" ]; then
  CREDENTIALS="$(read_file_or_empty "${HOME}/.sheets-cli/credentials.json")"
fi
if [ -z "$TOKEN" ]; then
  TOKEN="$(read_file_or_empty "${HOME}/.sheets-cli/token.json")"
fi

emit_secret "SHEETS_CLI_CREDENTIALS_JSON" "$CREDENTIALS"
emit_secret "SHEETS_CLI_TOKEN_JSON" "$TOKEN"
emit_secret "SHEETS_CLI_INTEGRATION" "${SHEETS_CLI_INTEGRATION:-1}"
