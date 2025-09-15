# n8n Workflow Guidelines

Purpose: Ensure all agents follow a consistent, reliable process for building, testing, and promoting n8n workflows that power the Vulcano AI data and social automations — without changing the website code.

## Principles

- Source of truth: Workflows live under `n8n/workflows/`. Changes to automations happen here, not in site HTML/JS.
- Production is explicit: The production workflow is the JSON file Ivan has imported and activated in n8n. Treat it as read‑only in Git and use it as a reference baseline.
- Incremental evolution: Draft locally, test, sanitize, then promote to a new production snapshot.
- Secrets stay in n8n: No API keys or tokens in JSON. Use n8n Credentials and environment.

## Naming & Lifecycle

- Production: `PRODUCTION_<AREA>_<PURPOSE>.json` or a custom admin alias (e.g. `IvanFile.json`)
  - Examples: `PRODUCTION_FEED_NEWS_AUTOPILOT.json`, `PRODUCTION_SOCIAL_AUTOPILOT.json`, `PRODUCTION_IVANFILE_AI_RESEARCH_AUTOPILOT.json`, or simply `IvanFile.json`.
  - Active production is whatever Ivan has imported and enabled in n8n autopilot. Treat production JSON as private (do not commit to the public repo).

- Candidate (ready for import/promotion tests): `CANDIDATE_<AREA>_<PURPOSE>.json`
  - Examples: `CANDIDATE_SOCIALMEDIA_AUTOPILOT.json`, `CANDIDATE_SOCIALMEDIA_WEEKLY_REPORT.json`.

- Drafts (working copies): `DRAFT_<AREA>_<PURPOSE>.json`
  - Example: `DRAFT_SOCIALMEDIA_LEGACY.json`.

- Tests: `<AREA>_<FEATURE>[_AGENT]_TEST_vYYYYMMDD-HHMM.json`
  - Example: `SOCIALMEDIA_POLISHER_TEST_v20250914-1100.json`.

- Experimental: `<AREA>_<FEATURE>[_AGENT]_EXP_vYYYYMMDD-HHMM.json`
  - Short‑lived or exploratory.

- Promotion to production:
  1. Start from the latest `PRODUCTION_*` as baseline (read‑only reference).
  2. Implement changes in `DRAFT_*` or `*_TEST_*`.
  3. When approved, copy to `CANDIDATE_*` and import to n8n for final validation.
  4. Promote by saving as a new `PRODUCTION_*` (or admin alias like `IvanFile.json`) if the purpose changes; otherwise replace the existing production file content.

## File Handling Rules

- Location: All workflow JSON files must reside in `n8n/workflows/`.
- Read/write data: Workflows may read `/data/*.json` and write to `/data/**` via GitHub API or repo runner (as configured). Do not write outside `data/`.
- Credentials: Reference n8n credentials by name; never paste tokens into JSON.
- Production visibility: Do NOT commit production workflows to the public repo. Keep real prod flows private in your n8n instance. Only sanitized templates belong in Git under `n8n/workflows/templates/`. The `n8n/workflows/production/` directory is git‑ignored by default.
  - Admin alias note: If an admin chooses a custom prod name (e.g., `IvanFile.json`), keep that JSON private. Use PRs and docs to describe behavior instead of committing raw JSON.
- Scheduled jobs: Encode timing inside the workflow (Schedule Trigger). Default cadences:
  - Social: 30–60 minutes (we use 45m in production).
  - Daily summaries: every 24h.
  - Weekly reports: every 168h.
- Idempotency: Prefer flows that tolerate repeated runs without duplicate output (e.g., dedupe by URL/ID).

## Agent Nodes & Tools

- LLM Agents may use:
  - HTTP Request tool for retrieval (news pages, APIs) when necessary.
  - Code tool (JS) for transforms (e.g., hashtag sanitization, truncation, selection).
  - Sub‑workflow tool to call another n8n workflow (compose pipelines).
- Guardrails for social:
  - Preserve links exactly when polishing text.
  - Enforce <= 280 chars including hashtags and link.
  - Limit hashtags (≤3) and avoid emojis by default.
  - Language: Spanish (LATAM) or Portuguese as needed.

## Data Contracts & Paths

- Inputs: Prefer using `/data/feed-latest.json` and `/data/feed-YYYY-MM-DD.json`, plus indices under `/data/index/`:
  - `by-topic.json`, `by-country.json`, `status.json`, `runs.json`.
- Outputs: Write to `/data/` paths only. Common outputs:
  - `data/runs/<ISO>.json` (per‑run snapshot)
  - `data/entries/YYYY‑MM‑DD/*.json` and `index.json`
  - `data/feed-latest.json`, `data/feed-YYYY-MM-DD.json`

## Roles & Responsibilities

- Ivan: Imports/enables production; approves promotions. Owns credentials.
- Agents (you): Create/update workflow JSONs per these guidelines; never modify production directly.
- Review: Use PRs or documented handoffs in STATUS.md when promoting a new `DEBUG###.json`.

## Examples in Repo

- Production baseline: `n8n/workflows/DEBUG007.json` (current stable at time of writing)
- Social drafts: `n8n/workflows/SOCIALMEDIA.json`, `n8n/workflows/SOCIALMEDIA-ENHANCED.json`
- Weekly report: `n8n/workflows/WEEKLY-REPORT.json`

## Suggestions

- Add an “import‑ready” check step before promotion: strip pinData, verify credentials references, and validate JSON schema.
- Use a small changelog in each workflow’s top‑level `notes` field (if used by your n8n export) to record intent and differences from prior DEBUG.
- Consider a nightly job that snapshots `/data/index/status.json` to monitor run health.

## Quick Checklist for Production Files (e.g., IvanFile.json)
- All nodes connected end‑to‑end; no orphan nodes.
- Inputs: private agent endpoints or public JSON reads (no scraping unknown sites).
- Validations: URL resolves (HEAD+GET), allowlist host (`/data/sources.json`), LATAM + AI scope.
- Outputs: category feed (e.g., `data/ai-research/feed-latest.json`) and/or consolidated feed via server or webhook.
- Secrets: all via n8n Credentials; no inline tokens.
- Webhooks: protected with shared secret and rotated IDs.
