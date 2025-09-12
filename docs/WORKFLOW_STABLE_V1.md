VULCANO Stable Workflow — V1 (My workflow)

Overview
- Purpose: Manual/scheduled research + automatic publish to GitHub Pages repo for the Vulcano AI site.
- Status: Stable V1 — first demo that performs successful writes to the repository and deploys automatically.

Key Files Written
- data/feed-latest.json: rolling feed used by the frontend for live content.
- data/feed-YYYY-MM-DD.json: daily snapshot (audit/history for the same day updates).

Why two files?
- latest: a single stable URL for the site/app to read, always up to date.
- snapshot: reproducibility and audit trail; if you run multiple times in a day, updates overwrite the same day file (or can be switched to per-run timestamp later).

High-level Flow
1) AUTOPILOT (hourly) and FEED_IN webhook converge to START.
2) BUILD_PARAMS: collects runtime params (query hints and repo paths). Defaults:
   - repoOwner: vulcanoai
   - repoName: vulcanoai.github.io
   - branch: main
   - pathLatest: data/feed-latest.json
   - pathSnapshot: data/feed-YYYY-MM-DD.json
3) xAI Grok Chat Model + Aether Memory + AGENT — Research: the agent gathers/returns strict JSON with articles.
4) PARSE_AGENT_JSON (safe): extracts strict JSON from the agent output.
5) VALIDATE_DEDUPE_SORT: dedupes, filters by recency/language, widens window if empty, and injects a dummy item if still empty, so every run publishes.
6) BUILD_GH_BODY: builds base64 content and target paths for latest/snapshot.
7) GITHUB_GET_LATEST_SHA: reads sha of latest (404 on first run is OK).
8) BUILD_PUT_LATEST: includes sha when present; prepares body.
9) GITHUB_PUT_LATEST: writes latest.
10) GITHUB_GET_SNAPSHOT_SHA: reads sha for today’s snapshot (404 on first run is OK).
11) BUILD_PUT_SNAPSHOT: includes sha when present; prepares body.
12) GITHUB_PUT_SNAPSHOT: writes snapshot.
13) RESPOND (FEED_IN): webhook response when triggered via FEED_IN.

Notes on SHAs
- GitHub requires sha when updating an existing file to prevent clobbering.
- On first run, GET returns 404; PUT runs without sha and creates the file.
- On subsequent runs, GET returns sha; PUT includes sha to update.

Authentication
- All GitHub HTTP Request nodes use the n8n “GitHub API” credential (PAT).
- No tokens or secrets are stored in the repository.
- If the org uses SSO, authorize the token for the vulcanoai org (Configure SSO on the token).
- If branch protection is enabled and disallows direct pushes, the flow can be extended with branch+PR fallback.

Frontend Integration
- The site should point to /data/feed-latest.json for a rolling feed.
- Snapshots are for audit/history and optional downstream analytics.

Extending from V1
- Per-run snapshots: use timestamped filenames to avoid GET/sha for snapshots and keep full run history.
- PR fallback: when PUT to main fails (403), create a branch, write there, and open a PR automatically.
- Source/browsing: enable agent web tools and add HEAD checks for URLs.
- Observability: add metrics/logging nodes for publish success and item counts.

Rationale & Guarantees
- No gating: manual trigger always publishes, ensuring deterministic verification.
- Dummy fallback: ensures visibility even when there are no fresh items.
- Separation of concerns: agent produces proposed items; validator enforces schema/recency; publisher handles idempotent writes.

Versioning
- File: docs/WORKFLOW_STABLE_V1.md (this document)
- Workflow id: matches VULCANO111.json structure replicated into n8n/workflows/latam-news-autopublish.json

