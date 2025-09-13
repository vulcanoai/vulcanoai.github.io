Workflow — DEBUG007 (Current Stable)

Date: 2025‑09‑13
Files: n8n/workflows/DEBUG007.json, n8n/workflows/DEBUG007-fixed.json (import‑ready)

Purpose
- End‑to‑end autonomous research → validation → GitHub publish → site render.
- Guarantees idempotent writes and deterministic, open data layout (see docs/DATA_LAYOUT.md).

Key Paths Written
- data/runs/<ISO>.json — per‑run snapshots (exact items + params + timestamps)
- data/entries/YYYY‑MM‑DD/<slug>-<hash>.json — one JSON per article (time capsule)
- data/entries/YYYY‑MM‑DD/index.json — per‑day counts by topic/country
- data/feed-latest.json — rolling merged feed
- data/feed-YYYY‑MM‑DD.json — daily merged snapshot
- data/index/by-topic.json, data/index/by-country.json — global counts

GitHub API pattern (n8n HTTP Request)
1) GET contents to discover sha + existing content
2) Code node merges new + old (union by URL) and builds PUT body
3) PUT contents with sha when updating, without sha when creating

Robustness fixes (in DEBUG007‑fixed)
- Normalized GET response shapes (json / json.body / json.data)
- Merge nodes between GET and PUT to ensure sha arrives reliably
- Empty-merge guards to avoid overwriting files with []
- GET nodes configured with ignoreResponseCode, alwaysOutputData, continueOnFail

High‑level node map (condensed)
- START → BUILD_PARAMS → AGENT — Research → PARSE_AGENT_JSON (safe)
- VALIDATE_DEDUPE_SORT → DIRECT_NORMALIZE (fan‑out):
  - BUILD_ENTRY_FILES → GITHUB_GET_ENTRY_SHA → MERGE → BUILD_PUT_ENTRY → GITHUB_PUT_ENTRY
  - BUILD_DAILY_INDEX → GITHUB_GET_DAILY_INDEX_SHA → MERGE → BUILD_PUT_DAILY_INDEX → GITHUB_PUT_DAILY_INDEX
  - BUILD_RUN_FILE → GITHUB_PUT_RUN
  - BUILD_GH_BODY (feeds) → GITHUB_GET_LATEST_SHA → BUILD_PUT_LATEST → GITHUB_PUT_LATEST
                          ↳ GITHUB_GET_SNAPSHOT_SHA → BUILD_PUT_SNAPSHOT → GITHUB_PUT_SNAPSHOT
  - BUILD_MASTER_INDEX → (by‑topic/by‑country): GET → MERGE → BUILD_PUT_* → PUT
  - BUILD_CATALOG → GITHUB_GET_CATALOG_SHA → MERGE → BUILD_PUT_CATALOG → GITHUB_PUT_CATALOG

Parameters (BUILD_PARAMS defaults)
- repoOwner: vulcanoai • repoName: vulcanoai.github.io • branch: main
- feedMaxLatest: 200 • feedMaxSnapshot: 500
- timeWindowHours: 24 (backfill up to 14 days if empty)

Frontend integration (current)
- Website reads /data/feed-latest.json; falls back to recent snapshots if needed.
- Cards link to per‑entry JSON and expose a compact Details dropdown with run/day/index links.
- Agents board shows compact summary + metrics from status.json/catalog.json and feed‑latest.

CI
- .github/workflows/status.yml — refreshes data/index/status.json and catalog.json on pushes to /data.
- .github/workflows/validate-data.yml — validates the full data layout on push/PR.

Known limitations
- by-country.json may be missing until first generation; the UI tolerates this.
- Observatorio legal and Panorama are partly curated; can be automated with dedicated flows.

