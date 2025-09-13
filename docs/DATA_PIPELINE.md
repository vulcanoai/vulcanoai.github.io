# Vulcano AI — Data Pipeline and Conflict Safety

This document describes how data flows into the repository, which files are generated, how the UI reads them, and how we prevent/handle conflicts when the platform (GitHub Actions) writes data while developers are also pushing changes.

## Overview

- Inputs (human/agents write):
  - `data/runs/*.json` — Hourly batches discovered by crawlers/agents (N8N or others).
  - `data/indie/*.json` — Manually submitted independent items.

- Generated (do not edit manually):
  - `data/feed-latest.json` — Consolidated, deduplicated, sorted feed.
  - `data/feed-YYYY-MM-DD.json` — Daily snapshot by discovery date.
  - `data/index/status.json` — Health info: last run, last update, total article count.
  - `data/index/runs.json` — Manifest of recent runs (file, timestamp, count).
  - `data/index/by-country.json`, `by-topic.json`, `by-source.json` — Aggregations.
  - `data/index/catalog.json` — Days available in archive.
  - `data/entries/YYYY-MM-DD/index.json` — Day index with counts by country/topic.
  - `data/entries/YYYY-MM-DD/*.json` — Per-article trace files for the day.

- Consumer (UI reads):
  - Noticias/Experimental/Observatorio consume `feed-latest.json` and snapshots.
  - Agentes (pipeline) consume `index/status.json` + `index/runs.json`.
  - Archivo consume `index/catalog.json` + `entries/…/index.json`.

## Automation

GitHub Action: `.github/workflows/update-feed.yml`

- Runs hourly and on manual dispatch.
- Executes `node scripts/build-feed.js` which:
  1. Loads the latest N runs (default 72) and indie items.
  2. Deduplicates by URL, sorts by `published_at`.
  3. Writes feed, snapshots, indices, status, and entries for the last 7 days.
- Commits and pushes only if there are changes.

### Triggers

- Cron: every hour.
- Push: when changes land under `data/runs/**` or `data/indie/**` (immediate consolidation without waiting for the top-of-hour cron).
- Manual: on demand from Actions UI or API.

### Manual Run

- GitHub UI: Actions → Consolidate Feed → Run workflow → Branch: `main` → Run.
- Or via API (requires a PAT or fine‑grained token with workflow scope):
  ```bash
  export GH_OWNER=vulcanoai
  export GH_REPO=vulcanoai.github.io
  export GH_TOKEN=ghp_your_token_here  # must have workflow scope
  curl -X POST \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer $GH_TOKEN" \
    https://api.github.com/repos/$GH_OWNER/$GH_REPO/actions/workflows/update-feed.yml/dispatches \
    -d '{"ref":"main"}'
  ```

### Conflict Prevention

- `concurrency` is enabled with group `consolidate-feed` to avoid overlapping runs.
- The commit step pulls latest changes with `git pull --rebase` before committing and pushing, so concurrent writes won’t cause non‑fast‑forward failures.
- Commit uses `[skip ci]` in message to avoid triggering other CI flows.

### Guidelines for Contributors

- DO edit/add input files only:
  - `data/runs/*.json`, `data/indie/*.json`
- DO NOT edit generated files manually (any path listed under “Generated”).
  - If you must adjust a generated value, change the inputs and rerun `scripts/build-feed.js`.
- Before pushing, pull/rebase to avoid conflicts:
  ```bash
  git fetch origin
  git pull --rebase
  node scripts/build-feed.js
  git add -A && git commit -m "chore(feed): local rebuild"
  git push
  ```

## Local Development

- Prerequisites: Node 18+.
- Rebuild data locally:
  ```bash
  node scripts/build-feed.js
  ```
- Serve the site (any static server) and navigate to:
  - Noticias: `/pages/noticias.html`
  - Agentes (pipeline): `/pages/agentes.html`
  - Archivo: `/pages/archivo.html`

## Troubleshooting

- “New resource” was added and caused conflicts:
  - Pull/rebase your branch, rerun the build, commit, push.
  - The Action already rebases and serializes runs with concurrency; if a push still fails, re-run the workflow.
- Missing run file referenced by `status.json`:
  - The UI falls back to `index/runs.json` and `feed-latest.json`.
- Duplicate items:
  - The deduplicator uses article URL (or `id`) as the key. Ensure sources provide canonical URLs.

## Ownership

- Input contract (owned by data-collection agents): `data/runs/*.json`, `data/indie/*.json`.
- Consolidation contract (owned by this repo): everything else under `data/` is generated.
