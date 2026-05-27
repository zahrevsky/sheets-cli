#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$ROOT/.bin"

docker_cmd() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  elif sudo docker info >/dev/null 2>&1; then
    sudo docker "$@"
  else
    return 1
  fi
}

ensure_docker() {
  if docker_cmd info >/dev/null 2>&1; then
    return 0
  fi
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker not installed. Run: sudo apt-get install -y docker.io && sudo dockerd &" >&2
    return 1
  fi
  if ! pgrep -x dockerd >/dev/null 2>&1; then
    echo "Starting dockerd (vfs storage for nested/cloud VMs)..."
    sudo dockerd --storage-driver=vfs >/tmp/dockerd.log 2>&1 &
    sleep 5
  fi
  if [ -S /var/run/docker.sock ] && ! docker info >/dev/null 2>&1; then
    sudo chmod 666 /var/run/docker.sock
  fi
  docker_cmd info >/dev/null 2>&1
}

mapfile -t ACT_SECRETS < <("$ROOT/scripts/load-act-secrets.sh")

has_google_credentials() {
  local c="${SHEETS_CLI_CREDENTIALS_JSON:-}"
  local t="${SHEETS_CLI_TOKEN_JSON:-}"
  [ -n "$c" ] || [ -f "${HOME}/.sheets-cli/credentials.json" ] || return 1
  [ -n "$t" ] || [ -f "${HOME}/.sheets-cli/token.json" ] || return 1
  return 0
}

"$ROOT/scripts/setup-workflow-tools.sh"

echo "==> actionlint"
"$BIN/actionlint" -color "$ROOT"/.github/workflows/*.yml

ACT_RUNNER_IMAGE="${ACT_RUNNER_IMAGE:-catthehacker/ubuntu:act-22.04}"
ACT_PLATFORM=(-P "ubuntu-latest=${ACT_RUNNER_IMAGE}")

echo "==> act (workflow list)"
"$BIN/act" "${ACT_PLATFORM[@]}" -l -W "$ROOT/.github/workflows/"

if ! ensure_docker; then
  echo "==> act run skipped (Docker unavailable)" >&2
  exit 1
fi

export DOCKER_HOST="${DOCKER_HOST:-unix:///var/run/docker.sock}"

preflight_github_actions() {
  local url="https://github.com/oven-sh/setup-bun/info/refs?service=git-upload-pack"
  local attempt wait=10
  for attempt in 1 2 3; do
    if curl -fsS --max-time 30 "$url" >/dev/null 2>&1; then
      return 0
    fi
    echo "GitHub/git endpoint not ready (attempt ${attempt}/3); waiting ${wait}s..." >&2
    sleep "$wait"
    wait=$((wait * 2))
  done
  echo "Warning: GitHub may be degraded; act can fail cloning actions (502, etc.)" >&2
  return 0
}

run_act_job() {
  local job="$1"
  shift
  preflight_github_actions
  "$BIN/act" "${ACT_PLATFORM[@]}" "$@" pull_request \
    -W "$ROOT/.github/workflows/ci.yml" \
    -j "$job" \
    --rm
}

echo "==> act (ci / test job)"
run_act_job test

if has_google_credentials; then
  echo "==> act (ci / integration job, live Google API)"
  run_act_job integration "${ACT_SECRETS[@]}"
else
  echo "==> act integration skipped (no SHEETS_CLI_* in env or ~/.sheets-cli)"
fi
