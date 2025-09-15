# 🚀 N8N Integration Setup for Vulcano AI

**Status**: Version 2.0 (reset‑first)

## 🎯 How It Works

The current stable n8n workflow (`DEBUG007`) is designed to:

1. **Research Agent**: Uses Grok to find AI news in LATAM
2. **Validation & Deduplication**: Processes and filters articles  
3. **GitHub Publishing**: Commits the following artifacts:
   - `data/runs/<ISO>.json` (per‑run snapshot)
   - `data/entries/YYYY‑MM‑DD/*.json` (per‑article entries)
   - `data/entries/YYYY‑MM‑DD/index.json` (daily index summary)
   - `data/feed-latest.json` (rolling feed, merged)
   - `data/feed-YYYY-MM-DD.json` (daily feed, merged)

The website is now configured to work perfectly with this workflow!

## 📊 Website Data Flow (v2.0)

The website now reads ONLY `/data/feed-latest.json` (no fallbacks). Expect an empty state until you publish fresh items.

## 🔄 Seed → Publish (v2.0)

### In your n8n instance:

1. Import and configure credentials:
   - GitHub token (repo access)
   - LLM keys if applicable (optional for baseline)
2. Execute `STARTUPS_FEED_AUTOPILOT_fixed.json` once → writes `data/startups/feed-latest.json`
3. Execute `MERGE_AND_CLEAN_GLOBAL_FEED_fixed.json` (include_existing=false) → writes `data/feed-latest.json`
4. Hard refresh the site (disable cache) → verify empty or fresh items appear

### What happens:

1. Grok researches recent LATAM AI news
2. Articles get classified and validated
3. **COMMITS TO GITHUB**: 
   - Adds `data/runs/<ISO>.json`
   - Creates/updates per‑article files under `data/entries/YYYY‑MM‑DD/`
   - Creates/updates daily index `data/entries/YYYY‑MM‑DD/index.json`
   - Merges into `data/feed-latest.json` and `data/feed-YYYY-MM-DD.json`
   - Updates indexes (`data/index/by-topic.json`, `data/index/by-country.json`) and catalog (`data/index/catalog.json`)
4. **Website updates instantly** with real articles!

## 📂 Data Structure Expected

Your workflow outputs article objects with this structure (handled by the website):

```json
[
  {
    "id": "unique-id",
    "title": "Article title",
    "summary": "Brief summary", 
    "url": "https://source.com/article",
    "source": "Source name",
    "source_url": "https://source.com/",
    "country": "México|Colombia|Regional|...",
    "topics": ["Startups", "Regulación", ...],
    "language": "es|pt",
    "published_at": "2025-09-12T10:00:00Z",
    "relevance": 0-10,
    "sentiment": "positive|neutral|negative", 
    "author": "Author name",
    "curator": "Codex 1"
  }
]
```

## 🎯 Testing Steps

1. **Trigger your n8n workflow manually**
2. **Check GitHub commits**: Should see new files in `data/runs/` and `data/entries/YYYY‑MM‑DD/`  
3. **Refresh website**: You'll see real articles from `feed-latest.json` (which now merges data across runs)
4. **Check console logs**: Will show "Cargados X artículos desde: /data/feed-latest.json (latest)"

## 📈 Persistence (v2.0)

- Daily snapshots can still be written by workflows, but the site will not read them by default.
- Re‑enable fallbacks only when content quality is guaranteed.

## 🔧 Repository Setup

Make sure your GitHub repository has:

```
/data/
├── entries/
│   └── YYYY‑MM‑DD/
│       ├── <slug>-<hash>.json     # one per article
│       └── index.json             # daily index (topics/countries counts)
├── runs/
│   └── <ISO>.json                 # per‑run snapshot
├── feed-latest.json               # rolling (merged) feed
├── feed-YYYY‑MM‑DD.json           # daily snapshot (merged)
├── index/
│   ├── by-topic.json
│   ├── by-country.json
│   └── catalog.json
└── sample-feed.json               # fallback only
```

## 🎉 Ready to Go Live!

**Everything is configured!** Just:

1. Run your n8n workflow 
2. Watch the GitHub commit happen
3. See real AI news on vulcano.ai! 

The website will show:
- ✅ **Real articles** from your n8n research
- ✅ **AI curator assignments** (Codex 1)
- ✅ **Country/topic filtering** working with real data
- ✅ **7+ day article history** automatically
- ✅ **Mobile responsive** interface with real content

**LET'S GOOO!** 🚀🔥

Notes
- Prefer `DEBUG007-fixed.json` when importing — it includes normalized GET/PUT handling and merge nodes.
- CI refreshes `data/index/status.json` and `data/index/catalog.json` after data changes.
- For the open data contract, see `docs/DATA_LAYOUT.md` and `docs/WORKFLOW_DEBUG007.md`.

---

*Ready for real AI news curation in LATAM!*
