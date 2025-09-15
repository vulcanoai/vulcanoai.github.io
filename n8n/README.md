N8N workflows (local only)

Usage summary

- Production workflow (active in n8n): The current stable autopilot is the file Ivan has imported and enabled. Today that is `n8n/workflows/DEBUG007.json` (subject to change as we promote newer versions). Treat this file as read‑only in Git; use it only as a reference.
- Drafts and experiments: Create new JSON workflows in this same folder and iterate locally. Promote to production via the naming/lifecycle rules below.

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

- Production snapshots: `DEBUG###.json` (e.g., `DEBUG007.json`). Highest number is the current stable candidate. Only Ivan imports/enables this in n8n.
- Test builds: `<AREA>_<FEATURE>[_AGENT]_TEST_vYYYYMMDD-HHMM.json` (e.g., `SOCIALMEDIA_POLISHER_TEST_v20250914-1100.json`).
- Experimental builds: `<AREA>_<FEATURE>[_AGENT]_EXP_vYYYYMMDD-HHMM.json` (short‑lived experiments).
- Import‑ready freeze: append `-fixed.json` when a draft is sanitized for import (no pinned data, no credentials).
- Promotion: when a test is approved, copy to `DEBUG###.json` (increment ###), commit, and Ivan imports it.

Current files (examples)

- Production (read‑only):
  - `n8n/workflows/PRODUCTION_FEED_NEWS_AUTOPILOT.json` — Consolidated feed/news pipeline (stable autopilot)
  - `n8n/workflows/PRODUCTION_SOCIAL_AUTOPILOT.json` — Social posts with AI polisher + validator (every 45 min)
  - `n8n/workflows/PRODUCTION_SOCIAL_WEEKLY_REPORT.json` — Weekly topics/countries summary tweets
- Drafts:
  - `n8n/workflows/DRAFT_SOCIALMEDIA_LEGACY.json` — Legacy/working draft (kept for reference)
  - `n8n/workflows/STARTUPS_FEED_AUTOPILOT_fixed.json` — Startups category via curated RSS (hourly, writes to `data/startups/*`)
  - `n8n/workflows/AI_RESEARCH_FEED_AUTOPILOT_fixed.json` — AI research via arXiv RSS (hourly, writes to `data/ai-research/*`)
  - `n8n/workflows/GLOBAL_AI_DISCOVERY_AUTOPILOT_fixed.json` — Source‑agnostic, multilingual discovery via Serper (hourly, writes to `data/discovery/*`)
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
