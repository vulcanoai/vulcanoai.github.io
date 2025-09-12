# 🚀 N8N Integration Setup for Vulcano AI

**Status**: Ready for your existing `latam-news-autopublish.json` workflow!

## 🎯 How It Works

Your existing n8n workflow (`latam-news-autopublish.json`) is designed to:

1. **Research Agent**: Uses Grok to find AI news in LATAM
2. **Validation & Deduplication**: Processes and filters articles  
3. **GitHub Publishing**: Commits to both:
   - `data/feed-latest.json` (live feed)
   - `data/feed-YYYY-MM-DD.json` (daily snapshot)

The website is now configured to work perfectly with this workflow!

## 📊 Website Data Flow

The website will now:

1. **Try `feed-latest.json`** first (your n8n live output)
2. **Fallback to snapshots** from the last 7 days if latest fails
3. **Aggregate & deduplicate** articles across all sources
4. **Display real data** as soon as you trigger the workflow!

## 🔄 Manual Trigger Process

### In your n8n instance:

1. **Import your workflow** (`latam-news-autopublish.json`) 
2. **Configure credentials**:
   - Grok API key 
   - GitHub token with repo access
3. **Set repository params**:
   - `repoOwner`: `vulcanoai` 
   - `repoName`: `vulcanoai.github.io`
4. **Hit the manual trigger button** 🚀

### What happens:

1. Grok researches recent LATAM AI news
2. Articles get classified and validated
3. **COMMITS TO GITHUB**: 
   - Updates `data/feed-latest.json`
   - Creates `data/feed-2025-09-12.json` snapshot
4. **Website updates instantly** with real articles!

## 📂 Data Structure Expected

Your workflow outputs this exact structure (which the website now handles):

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
2. **Check GitHub commits**: Should see new commit to `data/feed-latest.json`  
3. **Refresh website**: You'll see real articles instead of sample data!
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
├── feed-latest.json          # ← Your n8n workflow writes here
├── feed-2025-09-12.json     # ← Daily snapshots  
├── feed-2025-09-11.json
├── feed-2025-09-10.json
└── sample-feed.json         # ← Fallback only
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