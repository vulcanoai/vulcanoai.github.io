#!/usr/bin/env bash
set -euo pipefail

git config core.sparseCheckout true
git sparse-checkout init --cone
git sparse-checkout set '/*' '!:data'

git config remote.origin.promisor true || true
git config remote.origin.partialclonefilter blob:none || true

echo "Sparse-checkout configured to exclude /data."

