# Vulcano AI — Platform Snapshot (2025‑09‑13)

This document captures the current state of the platform from a user’s perspective, how it runs locally, how data flows, and prioritized improvement points. It is documentation only — no code or structure has been changed.

Important: The current working/stable n8n workflow is DEBUG007. Do not modify it until further notice.

- Stable file in repo: `n8n/workflows/DEBUG007.json:1`
- In prior notes it’s referenced as “debug007.json” — both refer to the same active workflow.

## Overview

- Static site with HTML/CSS/JS loading JSON data from `/data`.
- Entry redirects to Noticias: `index.html:1` → `/pages/noticias.html`.
- Client configuration: `assets/js/config.js:1` (feed and optional endpoints).
- Feed/data files are committed into the repo by the n8n workflow.

## How To Run Locally

- Any static server works, for example:
  - `python3 -m http.server 8080` then open `http://localhost:8080`
  - or `npx serve .`
- CSP note: Pages use strict CSP with `connect-src 'self'`. If/when you point the app at external endpoints (n8n/webhooks), add their origin(s) to the CSP in each page. See `pages/noticias.html:6` as reference.

## User Walkthrough (Current UX)

- Noticias (Home) — `pages/noticias.html:1`
  - Branded header with global time widget `pages/noticias.html:29`, filters/search block `pages/noticias.html:104`.
  - Loads from `data/feed-latest.json` first, then falls back to recent `data/feed-YYYY-MM-DD.json` snapshots.
- Agentes — `pages/agentes.html:1`
  - Agent health/status sourced from `data/agents.json`.
- Fuentes — `pages/fuentes.html:1`
  - Sources list and methodology, from `data/sources.json`.
- Observatorio Legal — `pages/observatorio-legal.html:1`
  - Legal tracking UI, reading `data/legal-sample.json`.
- Panorama — `pages/panorama.html:1`
  - Category/automation overview from `data/panorama.json`.
- Apoya — `pages/apoya.html:1`
  - Support tiers, Patreon/MP links, WhatsApp subscription flows.
- Crypto — `pages/crypto.html:1`
  - Visual “orb” demo powered by `assets/js/logo.js:1`.

Navigation is composed at runtime for header, footer, and a mobile bottom nav. See `assets/js/app.js:190`.

## Data Flow & Schema

- Primary feed (rolling): `data/feed-latest.json:1`
- Daily snapshot (merged): `data/feed-YYYY-MM-DD.json`
- Per-article entries: `data/entries/YYYY-MM-DD/<slug>-<hash>.json`
- Daily index (counts): `data/entries/YYYY-MM-DD/index.json`
- Master indices: `data/index/by-topic.json`, `data/index/by-country.json`
- Agents & sources: `data/agents.json:1`, `data/sources.json:1`

Expected article fields (handled by the site): see `README.md:1` for the authoritative schema. The loader normalizes slight variations (topics/temas, language/idioma, etc.) in `assets/js/feed.js:1`.

## N8N Workflow — DEBUG007 (Stable)

- File: `n8n/workflows/DEBUG007.json:1` (current working/stable). Do not modify until further notice.
- Triggers: hourly schedule + manual webhook.
- Research agent: xAI Grok LLM with Spanish prompt, parsed/validated to strict JSON, then normalized/deduplicated.
- Publishing via GitHub Content API writes:
  - Per-run snapshot: `data/runs/<ISO>.json`
  - Per-article files: `data/entries/YYYY-MM-DD/*.json`
  - Daily index: `data/entries/YYYY-MM-DD/index.json`
  - Rolling feed: `data/feed-latest.json`
  - Daily feed: `data/feed-YYYY-MM-DD.json`
  - Master indices: `data/index/by-topic.json`, `data/index/by-country.json`
- Repo defaults: `vulcanoai/vulcanoai.github.io` on `main`.
- Setup reference: `N8N_SETUP.md:1` (states DEBUG007 is stable).

Note: `STATUS.md:1` still mentions DEBUG006 in its header; leave it as-is for now. This snapshot document clarifies that DEBUG007 is the current working file.

## Security & Operations

- No secrets in client; n8n/serverless hold credentials. See `SECURITY.md:1`.
- Strict CSP across pages; add origins to `connect-src` when enabling external endpoints.
- CI:
  - Validate feeds on PR/push: `.github/workflows/validate-data.yml:1`
  - Generate `data/index/status.json` and catalog: `.github/workflows/status.yml:1`
- Optional serverless API (for Vercel/Netlify): `api/webhooks.js:1` exposes `/api/trigger-update`, `/api/indie-submit`, `/api/status` that call into n8n.

## Improvement Opportunities (Documentation Only)

- Filters persistence: Save filters/search to URL and `localStorage` for shareable states and session continuity.
- Loading UX: Add skeleton placeholders while feeds load to improve perceived performance.
- Feature gating: Hide/disable search/trigger UI until `searchAgentUrl`/`updateTriggerUrl` are configured in `assets/js/config.js:1`.
- CSP guidance: Provide a single place (doc/snippet) listing domains to add to `connect-src` when turning on remote endpoints.
- Performance: Consider deferring non-critical JS and splitting `assets/js/app.js` to reduce initial payload on mobile.
- Long list optimization: Virtualize large lists and lazy-load images as feed size grows.
- A11y polish: Recheck focus states and contrast across the new themed cards and interactive controls.
- WhatsApp UX: Unify the “Suscribirme” CTA and ensure frequency selection is explicit and consistent across pages.
- Docs alignment: Align `STATUS.md` wording with DEBUG007 when you next revise status (no need to change code).

## Guardrails

- Do not modify `n8n/workflows/DEBUG007.json:1` (a.k.a. “debug007.json”) until further notice. It is the current working/stable workflow.
- Keep `assets/js/config.js:1` endpoints as-is unless coordinated alongside CSP updates.
- Maintain the documented article schema to avoid breaking UI facets and indices.

## Key References

- `README.md:1` — Project overview, structure, local run.
- `index.html:1` — Redirect to Noticias.
- `pages/noticias.html:6` — CSP template; filters at `pages/noticias.html:104`.
- `assets/js/config.js:1` — Client config.
- `assets/js/feed.js:1` — Feed loading, normalization, fallbacks.
- `assets/js/app.js:190` — Unified navigation; time widget around `assets/js/app.js:942`.
- `data/feed-latest.json:1` — Rolling feed (generated by pipeline).
- `n8n/workflows/DEBUG007.json:1` — Stable workflow (do not change).
- `N8N_SETUP.md:1` — Workflow setup notes.
- `.github/workflows/*.yml` — Validation and status automation.
- `api/webhooks.js:1` — Serverless API for triggers/submissions/status.

---
Document created for coordination between UI/pipeline workstreams. No code or behavior has been altered.
