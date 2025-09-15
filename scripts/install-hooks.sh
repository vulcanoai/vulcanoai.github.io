#!/usr/bin/env bash
set -euo pipefail

HOOKS_DIR=".githooks"
TARGET_DIR=".git/hooks"

if [[ ! -d "$HOOKS_DIR" ]]; then
  echo "No $HOOKS_DIR directory found. Nothing to install."
  exit 0
fi

mkdir -p "$TARGET_DIR"
for hook in pre-commit pre-merge-commit; do
  if [[ -f "$HOOKS_DIR/$hook" ]]; then
    install -m 0755 "$HOOKS_DIR/$hook" "$TARGET_DIR/$hook"
    echo "Installed hook: $hook"
  fi
done

echo "Git hooks installed."

