Local development without pulling generated data

Goal: Keep your local dev repo light and avoid syncing large, auto‑generated files under `/data/` while GitHub Actions and n8n keep writing to the remote repository.

Recommended setup (sparse checkout)

1) Enable sparse‑checkout and partial clone on your local repo:

   git config core.sparseCheckout true
   git sparse-checkout init --cone
   git sparse-checkout set \
     '/*' \
     '!:data'

   # Optional: speed up with partial clone
   git config remote.origin.promisor true
   git config remote.origin.partialclonefilter blob:none

2) Pull as usual. The `/data` folder will be excluded locally, so you don’t download thousands of generated JSONs.

3) When you need to inspect data temporarily:

   git sparse-checkout add data/index data/feed-latest.json

   # After inspecting, you can remove again:
   git sparse-checkout set '/*' '!:data'

Why this works

- n8n workflows write to the GitHub repository via the GitHub API, and GitHub Actions consolidate feeds in the cloud. You only fetch code and docs locally.
- The website still serves `/data/*` from the remote repo. Your local development doesn’t need the full dataset.

Notes

- Keep secrets in n8n credentials. The CI action `Consolidate Feed` runs in GitHub and commits consolidated data.
- If you maintain long‑lived feature branches, re‑run the sparse‑checkout commands after branch switches if Git resets your config.

Guardrails

- The script `scripts/build-feed.js` refuses to write locally unless you set `VULCANO_ALLOW_LOCAL_DATA_WRITE=1` (or run in CI). This prevents accidental local data churn.
- Prefer running ingestion via n8n/CI only. Local builds are for debugging and should opt‑in explicitly.

Helper script

- You can add sparse settings with a helper script:

  scripts/setup-sparse-no-data.sh

Local commit guard

- Install repo‑managed git hooks to block accidental commits under `/data`:

  ./scripts/install-hooks.sh

- Override (not recommended):

  VULCANO_ALLOW_LOCAL_DATA_COMMIT=1 git commit -m "..."

