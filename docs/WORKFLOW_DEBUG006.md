# n8n Workflow — DEBUG006 (Current Stable)

Status: Stable (Sep 13, 2025)

This document captures the current, working n8n workflow used to publish real AI news to GitHub on every manual trigger. The workflow name in n8n is “DEBUG006”. It’s the canonical reference for the pipeline and replaces earlier debug versions.

## What It Does
- Researches news (agent with Grok), parses JSON output.
- Persists everything to GitHub (time‑capsule):
  - Per‑run snapshot: `data/runs/<ISO>.json`
  - Per‑article files: `data/entries/YYYY‑MM‑DD/<slug>-<hash>.json`
  - Daily index (summary): `data/entries/YYYY‑MM‑DD/index.json`
- Maintains the site feeds with merge (no overwrite):
  - Rolling: `data/feed-latest.json`
  - Snapshot: `data/feed-YYYY-MM-DD.json`

## Trigger Model
- Manual only. Trigger from n8n UI or via the Webhook node (`FEED_IN`), which returns a 200 response after commits are attempted.

## Node Map (high level)
- FEED_IN → BUILD_PARAMS → xAI Grok → AGENT — Research → PARSE_AGENT_JSON (safe)
- DIRECT_NORMALIZE → (fan out):
  - BUILD_ENTRY_FILES → GET_ENTRY_SHA (404 tolerant) → MERGE → BUILD_PUT_ENTRY → PUT_ENTRY
  - BUILD_DAILY_INDEX → GET_DAILY_INDEX_SHA (404 tolerant) → MERGE → BUILD_PUT_DAILY_INDEX → PUT_DAILY_INDEX
  - BUILD_RUN_FILE → PUT_RUN
  - BUILD_GH_BODY (feed) → GET_LATEST_SHA (404 tolerant) → BUILD_PUT_LATEST → PUT_LATEST → RESPOND
                                ↳ GET_SNAPSHOT_SHA (404 tolerant) → BUILD_PUT_SNAPSHOT → PUT_SNAPSHOT

## GitHub API Patterns
- GET (contents) to fetch `sha` and existing `content` (base64). Options:
  - `ignoreResponseCode: true`, `continueOnFail: true`, `alwaysOutputData: true`
- PUT body is always:
  ```json
  { "message": "...", "content": "<base64>", "branch": "main", "sha": "<if exists>" }
  ```
- Feed builders decode old content (if any), union with new items by URL, sort by date, and cap.

## Files Written Per Run
- `data/runs/<ISO>.json` — exact articles array + timestamp + params.
- `data/entries/YYYY-MM-DD/*.json` — one file per article (durable record).
- `data/entries/YYYY-MM-DD/index.json` — counts by topic/country for that day.
- `data/feed-latest.json` — merged rolling list (no overwrites).
- `data/feed-YYYY-MM-DD.json` — merged daily list (accumulates across runs that day).

## Error Handling
- First‑time file creation: GET returns 404, but nodes still output and the subsequent PUT creates the file.
- Updates: GET returns `sha`; PUT includes it to update in place.
- Daily index builder always receives both the meta and the GET response via a Merge node, avoiding timing issues.

## Manual Trigger — Expected Result
- New files appear under `data/runs/` and `data/entries/YYYY‑MM‑DD/`.
- `data/entries/YYYY‑MM‑DD/index.json` is created/updated.
- Feeds are updated (merged, not overwritten).
- Website reflects the new data (frontend reads from `/data/feed-latest.json` and recent snapshots).

## Verification Checklist
- Repo has fresh run snapshot(s) under `data/runs/`.
- Entries exist for the day under `data/entries/YYYY‑MM‑DD/`.
- Daily index exists: `data/entries/YYYY‑MM‑DD/index.json`.
- Feed files exist and are non‑empty: `data/feed-latest.json`, `data/feed-YYYY-MM-DD.json`.

## Notes
- Credentials are managed in n8n (GitHub API, xAI Grok). No secrets live in this repo.
- Workflow parameters (owner/repo/branch) default to `vulcanoai/vulcanoai.github.io@main` and can be overridden via the webhook payload.

