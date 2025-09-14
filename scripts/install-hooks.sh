#!/usr/bin/env bash
set -euo pipefail

HOOKS_DIR="$(git rev-parse --show-toplevel)/scripts/git-hooks"
if [[ ! -d "$HOOKS_DIR" ]]; then
  echo "Hooks directory not found: $HOOKS_DIR" >&2
  exit 1
fi

git config core.hooksPath "$HOOKS_DIR"
chmod +x "$HOOKS_DIR"/* || true
echo "Git hooks installed from $HOOKS_DIR"

