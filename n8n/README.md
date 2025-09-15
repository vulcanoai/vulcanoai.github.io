N8N workflows (local only)

Usage summary

- Production workflow (active in n8n): Production files use the `PRODUCTION_` prefix (e.g., `PRODUCTION_FEED_NEWS_AUTOPILOT.json`). Treat production files as read‑only in Git; use them only as a reference for behavior that is currently enabled in n8n.
- Drafts and experiments: Create new JSON workflows in this folder and iterate locally. Promote to production via the naming/lifecycle rules below.

Secrets and endpoints

- Set secrets in n8n Credentials/Environment (no secrets live in this repo):
  - `SERPER_API_KEY` (if used), `GITHUB_TOKEN` (repo‑scoped, least privilege), LLM keys (OpenAI/xAI), Twitter/X OAuth.
- Default data outputs (written by workflows):
  - `data/runs/<ISO>.json` (per‑run snapshot)
  - `data/entries/YYYY‑MM‑DD/*.json` (per‑article)
  - `data/entries/YYYY‑MM‑DD/index.json` (daily index)
  - `data/feed-latest.json` (rolling, merged)
  - `data/feed-YYYY-MM-DD.json` (daily, merged)

Local dev guardrails

- Avoid downloading or committing generated data locally. See `docs/LOCAL_DEV_DATA.md` for sparse‑checkout and commit hooks to keep `/data` cloud‑only.

Promotion/lifecycle and naming

- Production: `PRODUCTION_<AREA>_<FEATURE>.json`
  - Examples: `PRODUCTION_FEED_NEWS_AUTOPILOT.json`, `PRODUCTION_SOCIAL_AUTOPILOT.json`.
  - Rule: read‑only in Git; reflects the version running in n8n.
- Draft (import‑ready): `<AREA>_<FEATURE>[_SCOPE][_combined]_fixed.json`
  - Examples: `STARTUPS_FEED_AUTOPILOT_fixed.json`, `AI_RESEARCH_FEED_AUTOPILOT_fixed.json`, `MERGE_AND_CLEAN_GLOBAL_FEED_fixed.json`, `AI_LATAM_AUTOPILOT_combined_fixed.json`, `RESET_FEED_TO_EMPTY_fixed.json`.
  - Rule: “_fixed” indicates sanitized for import (ASCII node names, no embedded creds, no pinned data).
- Test builds: `<AREA>_<FEATURE>[_AGENT]_TEST_vYYYYMMDD-HHMM.json`
  - Example: `SOCIALMEDIA_POLISHER_TEST_v20250914-1100.json`.
- Experiments: `<AREA>_<FEATURE>[_AGENT]_EXP_vYYYYMMDD-HHMM.json` (short‑lived).
- Maintenance/Utilities: `RESET_*_fixed.json` or `UTIL_*_fixed.json` for one‑shot actions.

Conventions

- Names are UPPER_SNAKE_CASE with short, descriptive segments: `<AREA>` (STARTUPS, AI_RESEARCH, GLOBAL), `<FEATURE>` (FEED_AUTOPILOT, MERGE_AND_CLEAN, DISCOVERY_AUTOPILOT), optional `<SCOPE>` (e.g., `combined`).
- Suffix `_fixed` means import‑ready; append only after sanitizing (ASCII node names, defaulted options, no credentials).
- Date‑stamped variants include `vYYYYMMDD-HHMM` for reproducible test builds.
- Legacy `DEBUG###.json` files may still exist; treat them as read‑only snapshots.

Current files (examples)

- Production (read‑only):
  - `n8n/workflows/PRODUCTION_FEED_NEWS_AUTOPILOT.json` — Consolidated feed/news pipeline (stable autopilot)
  - `n8n/workflows/PRODUCTION_SOCIAL_AUTOPILOT.json` — Social posts with AI polisher + validator (every 45 min)
  - `n8n/workflows/PRODUCTION_SOCIAL_WEEKLY_REPORT.json` — Weekly topics/countries summary tweets
  - Recommended rename for AI research (if active in n8n): `PRODUCTION_AI_RESEARCH_FEED_AUTOPILOT.json`
- Drafts:
  - `n8n/workflows/DRAFT_SOCIALMEDIA_LEGACY.json` — Legacy/working draft (kept for reference)
  - `n8n/workflows/STARTUPS_FEED_AUTOPILOT_fixed.json` — Startups category via curated RSS (hourly, writes to `data/startups/*`)
  - `n8n/workflows/AI_RESEARCH_FEED_AUTOPILOT_fixed.json` — AI research via arXiv RSS (hourly, writes to `data/ai-research/*`)
  - `n8n/workflows/GLOBAL_AI_DISCOVERY_AUTOPILOT_fixed.json` — Source‑agnostic, multilingual discovery via Serper (hourly, writes to `data/discovery/*`)
  - `n8n/workflows/RESET_FEED_TO_EMPTY_fixed.json` — One‑shot reset: overwrites `data/feed-latest.json` with an empty articles array
  - `n8n/workflows/MERGE_AND_CLEAN_GLOBAL_FEED_fixed.json` — Merge, validate links, and publish a clean site feed
- Tests:
  - `n8n/workflows/SOCIALMEDIA_POLISHER_TEST_v20250914-1200.json`
  - `n8n/workflows/SOCIALMEDIA_WEEKLY_REPORT_TEST_v20250914-1200.json`

Agent guidelines

- Do not modify site HTML/JS for workflow behavior. All integration happens by editing or adding these JSON workflow files.
- Treat the active production JSON (`DEBUG###.json`) as read‑only. Branch from it to create drafts.
- Keep credentials external (n8n credentials). Do not embed API keys or tokens in JSON.
- Prefer small, composable workflows using: HTTP Request, Code (JS), sub‑workflow tools. Reuse data files under `/data/` as inputs/outputs.
- Schedule responsibly (e.g., 30–60 min for social posts; daily/weekly for summaries). Avoid overlapping triggers.

References

- Detailed guidelines: `docs/N8N_WORKFLOW_GUIDELINES.md` (naming, lifecycle, tooling, promotion).

Resetting the site feed (clean slate)

- Import `n8n/workflows/RESET_FEED_TO_EMPTY_fixed.json` and select your GitHub credential.
- Run the webhook `POST /webhook/reset-feed` (optionally pass `{ "repo_owner":"...","repo_name":"...","branch":"main" }`).
- The file `data/feed-latest.json` is overwritten with `{ version, generated_at, articles: [] }`.
- Frontend has been set to read ONLY `feed-latest.json` (no snapshots/runs fallback) so the site shows a clean empty state until new data arrives.

Renaming existing workflows to the new convention

- If you currently have a workflow named `NEWSAIRESEARCH.json` (or similar), and it is the production AI Research pipeline, rename it to:
  - File name: `PRODUCTION_AI_RESEARCH_FEED_AUTOPILOT.json`
  - Workflow display name (inside JSON): `PRODUCTION — AI Research Feed Autopilot`
- How to apply:
  - In n8n: open the workflow → set the Display Name.
  - Export as JSON → save in this repo under `n8n/workflows/PRODUCTION_AI_RESEARCH_FEED_AUTOPILOT.json`.
  - Treat production files as read‑only in Git; iterate via the corresponding `_fixed.json` draft.

Publishing path reminder

- Site reads only `data/feed-latest.json`. Ensure your production AI Research workflow either:
  - Publishes directly to `data/feed-latest.json`, or
  - Publishes to `data/ai-research/feed-latest.json` and then run `MERGE_AND_CLEAN_GLOBAL_FEED_fixed.json` to publish a clean `data/feed-latest.json`.
