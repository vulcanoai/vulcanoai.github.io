# 🚀 N8N Integration Setup for Vulcano AI

**Status**: Stable on `DEBUG006` (Sep 13, 2025)

## 🎯 How It Works

The current stable n8n workflow (`DEBUG006`) is designed to:

1. **Research Agent**: Uses Grok to find AI news in LATAM
2. **Validation & Deduplication**: Processes and filters articles  
3. **GitHub Publishing**: Commits the following artifacts:
   - `data/runs/<ISO>.json` (per‑run snapshot)
   - `data/entries/YYYY‑MM‑DD/*.json` (per‑article entries)
   - `data/entries/YYYY‑MM‑DD/index.json` (daily index summary)
   - `data/feed-latest.json` (rolling feed, merged)
   - `data/feed-YYYY-MM-DD.json` (daily feed, merged)

The website is now configured to work perfectly with this workflow!

## 📊 Website Data Flow

The website will now:

1. **Try `feed-latest.json`** first (your n8n live output)
2. **Fallback to snapshots** from the last 7 days if latest fails
3. **Aggregate & deduplicate** articles across all sources
4. **Display real data** as soon as you trigger the workflow!

## 🔄 Manual Trigger Process

### In your n8n instance:

1. **Import your workflow** (`DEBUG006.json`) 
2. **Configure credentials**:
   - Grok API key 
   - GitHub token with repo access
3. **Set repository params** (defaults are preconfigured):
   - `repoOwner`: `vulcanoai` 
   - `repoName`: `vulcanoai.github.io`
4. **Hit the manual trigger button** 🚀

### What happens:

1. Grok researches recent LATAM AI news
2. Articles get classified and validated
3. **COMMITS TO GITHUB**: 
   - Adds `data/runs/<ISO>.json`
   - Creates/updates per‑article files under `data/entries/YYYY‑MM‑DD/`
   - Creates/updates daily index `data/entries/YYYY‑MM‑DD/index.json`
   - Merges into `data/feed-latest.json` and `data/feed-YYYY-MM-DD.json`
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
    "curator": "Luciano AI"
  }
]
```

## 🎯 Testing Steps

1. **Trigger your n8n workflow manually**
2. **Check GitHub commits**: Should see new files in `data/runs/` and `data/entries/YYYY‑MM‑DD/`  
3. **Refresh website**: You'll see real articles from `feed-latest.json` (which now merges data across runs)
4. **Check console logs**: Will show "Cargados X artículos desde: /data/feed-latest.json (latest)"

## 📈 7-Day Persistence 

The website now intelligently:
- **Aggregates articles** from the last 7 days of snapshots
- **Deduplicates** by URL to avoid repeats
- **Sorts by date** (newest first) and relevance
- **Maintains history** even if latest feed fails

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
└── sample-feed.json               # fallback only
```

## 🎉 Ready to Go Live!

**Everything is configured!** Just:

1. Run your n8n workflow 
2. Watch the GitHub commit happen
3. See real AI news on vulcano.ai! 

The website will show:
- ✅ **Real articles** from your n8n research
- ✅ **AI curator assignments** (Luciano AI, Esperanza AI, etc.)
- ✅ **Country/topic filtering** working with real data
- ✅ **7+ day article history** automatically
- ✅ **Mobile responsive** interface with real content

**LET'S GOOO!** 🚀🔥

---

*Ready for real AI news curation in LATAM!*
