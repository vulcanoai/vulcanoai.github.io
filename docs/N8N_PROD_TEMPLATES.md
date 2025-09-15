Production n8n Workflows (Private)

- Do not commit real workflow JSONs to this repo.
- Keep production flows private in your n8n instance (or in a private repo/vault).
- If you need to document a flow, describe it at a high level (no JSON export):

Example: AI Research Autopilot (sanitized outline)
- Trigger: hourly
- Steps:
  - BUILD_PARAMS: category=ai-research, timeWindowHours=168
  - FETCH: private retrievers/agent endpoints (authenticated)
  - DEDUPE: by URL
  - PUBLISH: write category feed to data/ai-research/feed-latest.json via GitHub API (use n8n credentials)
  - TRIGGER_MERGE: call merge-clean webhook (with shared secret)

Security Notes
- Use n8n Credentials; never paste tokens in JSON.
- Add shared-secret validation to all public webhooks.
- Rotate webhook IDs if a sanitized export is ever shared.

