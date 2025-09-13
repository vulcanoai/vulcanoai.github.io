# Data Directory

This folder contains both inputs (written by agents or humans) and generated artifacts (written by the consolidation script / GitHub Action).

Inputs (safe to edit/add):

- `runs/*.json`
- `indie/*.json`

Generated (do not edit manually):

- `feed-latest.json`
- `feed-YYYY-MM-DD.json`
- `index/*.json`
- `entries/YYYY-MM-DD/*.json`

To regenerate outputs locally:

```bash
node scripts/build-feed.js
```

See `docs/DATA_PIPELINE.md` for details.

