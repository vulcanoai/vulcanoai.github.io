N8N workflow (local only)

- Import `n8n/workflows/latam-news-autopublish.json` into your n8n instance.
- Set secrets in n8n Credentials/Environment (no secrets live in this repo):
  - `SERPER_API_KEY`: for https://serper.dev (Google News)
  - `GITHUB_TOKEN`: repo-scoped token to write `data/*.json` (least privilege)
- Optional: Trigger via webhook `POST /webhook/latam-news` with overrides:
  - `{ "prompt": "artificial intelligence in LATAM last 24h", "time_window_hours": 24, "languages": ["es","pt"], "repo_owner":"<org>","repo_name":"<repo>","branch":"main" }`
- Default publish paths:
  - `data/feed-latest.json` (rolling)
  - `data/feed-YYYY-MM-DD.json` (daily snapshot)

To sync the site automatically, set `assets/js/config.js: feedUrl` to `/data/feed-latest.json`.

Security: this folder is ignored by `.gitignore`; keep the workflow local if preferred. No credentials are embedded.

