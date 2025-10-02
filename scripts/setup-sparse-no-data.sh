#!/usr/bin/env bash
set -euo pipefail

# Configure sparse-checkout to exclude /data from the working tree,
# while still allowing remote workflows (n8n/CI) to commit data to the repo.

echo "[sparse] Configuring sparse-checkout to exclude /data ..."

# Ensure inside a git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "This script must be run within a git repository" >&2
  exit 1
}

# Turn off cone mode to allow negative patterns
git config core.sparseCheckout true
git sparse-checkout init || true
git config core.sparseCheckoutCone false

# Partial clone hints (optional, speeds up fetch)
git config remote.origin.promisor true || true
git config remote.origin.partialclonefilter blob:none || true

SPARSE_FILE=".git/info/sparse-checkout"
mkdir -p .git/info
cat > "$SPARSE_FILE" <<'PATTERNS'
/*
!/data/
PATTERNS

echo "[sparse] Patterns written to $SPARSE_FILE"
echo "[sparse] Applying sparse-checkout ..."
git read-tree -mu HEAD

echo "[sparse] Done. The /data directory will not be checked out locally."

