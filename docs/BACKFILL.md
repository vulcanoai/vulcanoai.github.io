Backfill Feeds from Run Snapshots

Purpose
- Rebuild `data/feed-latest.json` and today’s `data/feed-YYYY-MM-DD.json` from the time‑capsule run snapshots in `data/runs/`.
- Handy for seeding the site or recovering empty feeds before the next n8n run.

Usage
- Run locally from repo root:
  - `python3 scripts/backfill_feeds_from_runs.py`
- Outputs:
  - `data/feed-latest.json` (merged unique by URL, newest first, cap 200)
  - `data/feed-YYYY-MM-DD.json` (today only, cap 500)

Details
- Dedupe by URL, prefer newest `published_at` then higher `relevance`.
- Leaves per‑article entries as‑is (those are written by the workflow).

Troubleshooting
- If feeds remain empty, verify `data/runs/` JSON structure includes `articles` arrays.
- Check file permissions in your environment.

