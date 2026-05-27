#!/usr/bin/env bash
# Explain why `gh secret` cannot feed act directly.
set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)}"

echo "GitHub Actions secrets are write-only: gh/API cannot read values after storage."
echo "For act, use scripts/load-act-secrets.sh (env + ~/.sheets-cli) or:"
echo "  act ... -s NAME=\$(gh variable get NAME --repo OWNER/REPO)   # only for Variables, not Secrets"
echo ""

if [ -n "$REPO" ]; then
  echo "Secret names in ${REPO} (values not shown):"
  if gh secret list --repo "$REPO" 2>/dev/null; then
    :
  else
    echo "  (gh secret list failed — token may lack admin:repo or secrets scope)"
  fi
fi
