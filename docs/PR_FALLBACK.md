PR Fallback (Branch Protection)

Overview
- When direct PUT to `main` is blocked (403) by branch protection, publish to a short‑lived branch and open a PR.
- This repo includes a helper script you can call from n8n (via HTTP Request to a webhook you host) or locally.

Script: scripts/gh-pr-fallback.js (Node‑less variant provided in Python soon; for now use the pattern below)

Recommended Flow (n8n)
- After any `GITHUB_PUT_*` node, set `ignoreResponseCode: true`.
- Add a Code node to detect 403 and build a payload: `{ owner, repo, base: 'main', branch: 'autopub-<ISO>', path, message, content(base64) }`.
- POST that JSON to an endpoint that invokes the fallback script with `GITHUB_TOKEN`.

GitHub API Steps (pseudocode)
1) GET `repos/:owner/:repo/git/ref/heads/:base` → base SHA
2) POST `repos/:owner/:repo/git/refs` with `{ ref: 'refs/heads/<branch>', sha: <baseSHA> }` (ignore if exists)
3) PUT `repos/:owner/:repo/contents/:path` with `{ message, content, branch: <branch> }` (include sha if file exists)
4) POST `repos/:owner/:repo/pulls` with `{ title, head: <branch>, base: <base> }` (ignore if already open)

Security
- Use a repo‑scoped PAT with permissions: `contents:write`, `pull_requests:write`.
- If your org enforces SSO, authorize the token for the org.

Integration Notes
- Keep direct push path as the default (fast path). Trigger the PR fallback only on 403.
- You can generalize to batch multiple file writes into a single branch + PR per run.

