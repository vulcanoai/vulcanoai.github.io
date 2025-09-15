Agent Protocol — PR‑Based News Curation (Public, Source‑Agnostic)

Purpose: Enable autonomous agents to discover, validate, and publish news via GitHub PRs — without exposing production workflow JSON or credentials. Agents operate “like a clock” using public data reads and authenticated proposal/review endpoints.

Public Data Reads (no auth)
- Feed (consolidated): GET /data/feed-latest.json
- Status: GET /data/index/status.json
- Catalog: GET /data/index/catalog.json
- Reviews manifest (PR telemetry): GET /data/index/reviews.json

Write Endpoints (server holds credentials)
- Propose articles (open PR):
  - POST /api/ai-propose
  - Body: { proposer?: string, articles: Article[] }
  - Returns: { proposal: string, pr: number, url: string }
- Review a proposal (approve/reject/comment):
  - POST /api/ai-review
  - Body: { pr_number: number, reviewer: string, decision: 'approve'|'reject'|'comment', comment?: string }
- Trusted submit (optional, bypasses PRs):
  - POST /api/ai-submit
  - Body: { articles: Article[] } | Article[]

GitHub Webhook (private → server)
- Configure a GitHub webhook to POST to `/api/github-webhook` with a shared secret.
- On PR merged events, the server:
  - Reads merged proposal files under `data/proposals/<id>/articles.json`
  - Validates (URL resolves, allowlisted host, LATAM scope, AI topic)
  - Publishes to `data/ai-research/feed-latest.json`
  - Consolidates into `data/feed-latest.json` and updates `data/index/status.json`
  - Updates `data/index/reviews.json` to mark the PR as merged

Article Schema (minimum)
{
  "id": string | omitted (derived from url/title),
  "title": string,
  "summary": string,
  "url": string,
  "source": string (optional),
  "source_url": string (optional — will default to origin(url)),
  "country": string (default "Regional"),
  "topics": string[],
  "language": "es|pt|en" (default "es"),
  "published_at": ISO-8601 (default now),
  "relevance": 0..10 (default 6),
  "sentiment": "positive|neutral|negative" (default "neutral"),
  "author": string (optional),
  "curator": string (default "Codex 1")
}

Agent Roles
- Researcher: discovers candidates from the open web; normalizes to Article[]; POSTs to /api/ai-propose
- Validator: reads /data/index/reviews.json to find open PRs; fetches proposal content from PR branch via GitHub web UI (or relies on server’s manifest) and POSTs decision to /api/ai-review
- Publisher (optional): after PR merge, triggers consolidation in n8n (private). Not exposed in public repo.

Prompts (Templates)

1) Researcher Prompt
System: You are Codex 1, an autonomous LATAM AI news researcher. Find verifiable, recent news (≤ 7 days), normalize to JSON strictly (Article[]). Verify links resolve (HTTP 2xx), prefer Spanish/Portuguese, dedupe and extract topics and country.
User: Return ONLY a JSON object with key "articles" and value Article[]. No commentary.

2) Validator Prompt
System: You are a reviewer agent. Given proposed articles (Article[]) and today’s feed (GET /data/feed-latest.json), ensure: (a) not duplicates by URL/title, (b) links resolve (2xx with reasonable timeout), (c) language in {es, pt, en}, (d) concise summary ≤ 500 chars. Produce a decision per item and overall decision: approve/reject/comment with reason.

Human‑like Repo Browsing (no tokens)
- Agents can read public data via:
  - raw: https://raw.githubusercontent.com/<owner>/<repo>/main/data/...
  - site: https://vulcanoai.github.io/data/...
- Avoid GitHub API for reads to simplify credentials.
- All writes (branches/PRs/reviews) are proxied by our server via /api endpoints.

Example Calls

# Propose
curl -X POST https://<host>/api/ai-propose \
  -H 'Content-Type: application/json' \
  -d '{
    "proposer":"Codex 1",
    "articles":[{
      "title":"Startup X levanta ronda en México",
      "summary":"La compañía recauda…",
      "url":"https://medio.example/noticia",
      "country":"México",
      "topics":["Startups","Inversión"],
      "language":"es"
    }]}'

# Review (approve)
curl -X POST https://<host>/api/ai-review \
  -H 'Content-Type: application/json' \
  -d '{ "pr_number": 123, "reviewer":"Validator‑A", "decision":"approve", "comment":"Looks good" }'

Dashboard Telemetry
- /data/index/reviews.json drives:
  - PRs abiertos
  - Pendientes (revisiones requeridas)
  - Última revisión (timestamp, reviewer, decision)

Security
- No tokens in JSON or repo.
- All writes go through server with GITHUB_TOKEN.
- Add shared secrets to webhooks (n8n) and rotate webhook IDs if ever shared.
