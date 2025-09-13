N8N workflow (local only)

- Import the current stable workflow (`DEBUG006.json`) into your n8n instance.
  - For reference, earlier working file: `n8n/workflows/latam-news-autopublish.json` (kept as a baseline).
- Set secrets in n8n Credentials/Environment (no secrets live in this repo):
  - `SERPER_API_KEY`: for https://serper.dev (Google News)
  - `GITHUB_TOKEN`: repo-scoped token to write `data/*.json` (least privilege)
- Optional: Trigger via webhook `POST /webhook/latam-news` with overrides:
  - `{ "prompt": "artificial intelligence in LATAM last 24h", "time_window_hours": 24, "languages": ["es","pt"], "repo_owner":"<org>","repo_name":"<repo>","branch":"main" }`
- Default publish paths:
  - `data/runs/<ISO>.json` (per‑run snapshot)
  - `data/entries/YYYY‑MM‑DD/*.json` (per‑article)
  - `data/entries/YYYY‑MM‑DD/index.json` (daily index)
  - `data/feed-latest.json` (rolling, merged)
  - `data/feed-YYYY-MM-DD.json` (daily, merged)

To sync the site automatically, set `assets/js/config.js: feedUrl` to `/data/feed-latest.json`.

Security: this folder is ignored by `.gitignore`; keep the workflow local if preferred. No credentials are embedded.
