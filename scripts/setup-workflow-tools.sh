#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$ROOT/.bin"
mkdir -p "$BIN"

ACTIONLINT_VERSION="1.7.7"
ACT_VERSION="0.2.88"

os="$(uname -s)"
arch="$(uname -m)"
case "$os" in
  Linux) os_name=linux ;;
  Darwin) os_name=darwin ;;
  *)
    echo "Unsupported OS: $os" >&2
    exit 1
    ;;
esac
case "$arch" in
  x86_64 | amd64)
    arch_name=amd64
    act_arch=x86_64
    ;;
  arm64 | aarch64)
    arch_name=arm64
    act_arch=arm64
    ;;
  *)
    echo "Unsupported arch: $arch" >&2
    exit 1
    ;;
esac

actionlint_asset="actionlint_${ACTIONLINT_VERSION}_${os_name}_${arch_name}.tar.gz"
actionlint_url="https://github.com/rhysd/actionlint/releases/download/v${ACTIONLINT_VERSION}/${actionlint_asset}"

if [ ! -x "$BIN/actionlint" ]; then
  echo "Installing actionlint ${ACTIONLINT_VERSION}..."
  tmp="$(mktemp -d)"
  curl -fsSL "$actionlint_url" -o "$tmp/actionlint.tar.gz"
  tar -xzf "$tmp/actionlint.tar.gz" -C "$tmp"
  install -m 755 "$tmp/actionlint" "$BIN/actionlint"
  rm -rf "$tmp"
fi

case "$os_name" in
  linux) act_asset="act_Linux_${act_arch}.tar.gz" ;;
  darwin) act_asset="act_Darwin_${act_arch}.tar.gz" ;;
esac
act_url="https://github.com/nektos/act/releases/download/v${ACT_VERSION}/${act_asset}"

if [ ! -x "$BIN/act" ]; then
  echo "Installing act ${ACT_VERSION}..."
  tmp="$(mktemp -d)"
  curl -fsSL "$act_url" -o "$tmp/act.tar.gz"
  tar -xzf "$tmp/act.tar.gz" -C "$tmp"
  install -m 755 "$tmp/act" "$BIN/act"
  rm -rf "$tmp"
fi

echo "Installed:"
"$BIN/actionlint" -version
"$BIN/act" --version
