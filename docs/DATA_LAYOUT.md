Data Layout — Open, Reproducible, Queryable

This repository serves as an open data store. Anyone with read‑only access to GitHub can explore, diff, and consume the same artifacts that power the website. The layout and invariants below make this reliable and self‑documenting.

Top‑level files
- data/feed-latest.json — Rolling merged feed (most recent first). Open for programmatic consumption; no authentication required.
- data/feed-YYYY-MM-DD.json — The day’s merged snapshot. All runs for the same day accumulate here.

Time‑capsule (immutable by convention)
- data/runs/<ISO>.json — Snapshot per n8n run. Contains the exact array of articles emitted + runtime params and timestamps.
- data/entries/YYYY-MM-DD/*.json — One JSON per article with deterministic filename:
  - data/entries/<date>/<slug>-<hash>.json
  - slug = normalized title (ascii, kebab case, <= 80 chars)
  - hash = short 8‑hex hash of the URL
  - File body includes the canonical article schema (see docs/schemas/article.v1.json)
- data/entries/YYYY-MM-DD/index.json — Summary for the day: counts by topic/country and metadata.

Indexes
- data/index/by-topic.json — Aggregated counts per topic (today or most recent generation).
- data/index/by-country.json — Aggregated counts per country (today or most recent generation).
- data/index/catalog.json — List of available day partitions for easy enumeration.
- data/index/status.json — Freshness record (last run ISO, last feed update, counts).

Guarantees
1) Idempotent writes: GitHub PUTs include sha when updating, preventing clobbering.
2) Deterministic filenames: Given (title, url, published_at), a client can reconstruct the entry path.
3) Human‑first: Files are pretty‑printed JSON (2‑space indent), suitable for code review.
4) Backpressure safe: On first runs / missing files, GET returns 404 → PUT creates the file (no failures).

Compat notes
- Older sample files (e.g., data/sample-feed.json) are preserved for documentation and offline demos, but the website never relies on them in production.
- All new data follows version: "v1.0" for consistency; schema evolution uses minor versions with additive fields only.

See also
- docs/schemas/article.v1.json
- docs/schemas/daily-index.v1.json
- docs/schemas/run.v1.json

