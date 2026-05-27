#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$ROOT/.bin"

"$ROOT/scripts/setup-workflow-tools.sh"

echo "==> actionlint"
"$BIN/actionlint" -color "$ROOT"/.github/workflows/*.yml

ACT_RUNNER_IMAGE="${ACT_RUNNER_IMAGE:-catthehacker/ubuntu:act-latest}"
ACT_PLATFORM=(-P "ubuntu-latest=${ACT_RUNNER_IMAGE}")

echo "==> act (workflow list)"
"$BIN/act" "${ACT_PLATFORM[@]}" -l -W "$ROOT/.github/workflows/"

if docker info >/dev/null 2>&1; then
  echo "==> act (dry-run: ci / test job)"
  "$BIN/act" "${ACT_PLATFORM[@]}" pull_request -W "$ROOT/.github/workflows/ci.yml" -j test -n
else
  echo "==> act dry-run skipped (Docker not available; act -l succeeded)"
fi
