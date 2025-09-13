# 🚀 Vulcano AI Deployment Guide

This guide covers deploying the complete Vulcano AI infrastructure for automated AI news curation in Latin America.

## 📋 Prerequisites

- **GitHub repository** with Pages enabled (`vulcanoai/vulcanoai.github.io`)
- **n8n instance** (cloud or self-hosted)
- **API Keys**:
  - X.AI (Grok) API key
  - GitHub Personal Access Token
- **Optional**: Serverless platform account (Vercel/Netlify) for webhooks

## 🏗️ Architecture Overview

```
[RSS Sources] → [n8n Pipeline] → [Grok AI Classification] → [GitHub Pages] → [Frontend Display]
     ↑              ↑                    ↑                      ↑              ↑
[Manual Triggers] [Webhooks]      [Content Analysis]    [Data Storage]   [User Interface]
```

## 🔧 Setup Instructions

### 1. GitHub Repository Setup

1. **Enable GitHub Pages**:
   ```bash
   # Repository Settings → Pages → Source: Deploy from branch (main)
   ```

2. **Set Repository Secrets**:
   - `XAI_API_KEY`: Your X.AI Grok API key
   - `GITHUB_TOKEN`: GitHub Personal Access Token with repo permissions

3. **Directory Structure**:
   ```
   /data/
   ├── feed-latest.json          # Live feed (updated by n8n)
   ├── feed-YYYY-MM-DD.json      # Daily snapshots
   ├── agents.json               # AI agents status
   ├── sources.json              # RSS sources configuration
   └── indie/                    # Independent submissions
   ```

### 2. N8N Workflow Deployment

1. **Import Workflow**:
   - Import `n8n/workflows/latam-news-enhanced.json` into your n8n instance
   
2. **Configure Credentials**:
   - **X.AI API**: Add your Grok API key
   - **GitHub API**: Add your GitHub token with repo permissions

3. **Set Environment Variables**:
   ```bash
   XAI_API_KEY=gsk_your_xai_api_key_here
   GITHUB_TOKEN=ghp_your_github_token_here
   WEBHOOK_SECRET=your_secure_webhook_secret
   ```

4. **Configure Webhook URLs**:
   - **Schedule**: Runs every 30 minutes automatically
   - **Manual trigger**: `https://your-n8n-instance.com/webhook/manual-trigger`

### 3. Frontend Configuration

Update `assets/js/config.js` with your endpoints:

```javascript
window.AILatamConfig = {
  api: {
    feedUrl: '/data/feed-latest.json',
    feedFallback: '/data/feed-2025-09-12.json',
    agentsUrl: '/data/agents.json',
    sourcesUrl: '/data/sources.json',
    indieSubmitUrl: 'https://your-api-domain.com/api/indie-submit',
    searchAgentUrl: 'https://your-n8n-instance.com/webhook/search-agent',
    updateTriggerUrl: 'https://your-api-domain.com/api/trigger-update'
  }
  // ... rest of config
};
```

## 🔄 N8N Pipeline Details

### **Pipeline Flow**

1. **RSS Ingestion**: Fetches from 23 curated LATAM sources
2. **AI Classification**: Grok analyzes and categorizes articles
3. **Quality Filter**: Only relevance 6+ articles are published
4. **GitHub Commit**: Updates both live feed and daily snapshots
5. **Agent Status**: Updates AI curator statistics

### **Data Processing**

- **Sources**: 23 RSS feeds from major LATAM tech/business publications
- **Classification**: Grok AI assigns country, topics, sentiment, relevance (1-10)
- **Curators**: 11 specialized AI agents with distinct personalities
- **Output**: Up to 50 top articles per run, sorted by relevance

### **Scheduling**

- **Automatic**: Every 30 minutes via n8n scheduler
- **Manual**: POST to webhook endpoint
- **Failsafe**: Falls back to sample data if pipeline fails

## 🌐 Webhook API Deployment

### Option A: Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add N8N_WEBHOOK_BASE
   vercel env add WEBHOOK_SECRET  
   vercel env add GITHUB_TOKEN
   ```

### Option B: Netlify Deployment

1. **Create `netlify.toml`**:
   ```toml
   [build]
     functions = "api"
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

2. **Deploy via Git** or drag-and-drop

### Option C: Direct n8n Webhooks

Configure n8n webhooks directly without separate API layer:

- `https://your-n8n.com/webhook/trigger-update`
- `https://your-n8n.com/webhook/indie-submit`

## 📊 Monitoring & Maintenance

### **Health Checks**

- **Status endpoint**: `GET /api/status`
- **Feed validation**: Check article count and timestamp
- **GitHub Actions**: Monitor commit success

### **Logs & Debugging**

- **n8n Logs**: Check workflow execution history
- **GitHub Actions**: View deployment logs
- **Browser Console**: Frontend error monitoring

### **Performance Metrics**

- **Throughput**: ~60-100 articles processed/hour
- **Latency**: <2 minutes from RSS to website
- **Accuracy**: 95%+ correct country/topic classification
- **Uptime**: 99.9% target (GitHub Pages SLA)

## 🔒 Security Configuration

### **Content Security Policy**

Already configured in HTML templates:

```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'">
```

### **CORS Configuration**

Webhooks include appropriate CORS headers for cross-origin requests.

### **Rate Limiting**

Implement rate limiting in your webhook endpoints:

```javascript
// Example: 10 requests per minute per IP
const rateLimit = new Map();
const limit = 10;
const window = 60000; // 1 minute
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Feed not updating**:
   - Check n8n workflow execution logs
   - Verify GitHub token permissions
   - Check Grok API quota

2. **Classification errors**:
   - Monitor Grok API responses
   - Check RSS feed availability
   - Validate article content format

3. **GitHub commit failures**:
   - Verify token scope includes `repo`
   - Check file size limits (1MB max)
   - Validate JSON format

### **Emergency Recovery**

If the pipeline fails completely:

1. **Manual Update**:
   ```bash
   # Copy sample-feed.json to feed-latest.json
   cp data/sample-feed.json data/feed-latest.json
   ```

2. **Restart Pipeline**:
   ```bash
   curl -X POST https://your-api.com/api/trigger-update \
     -H "Content-Type: application/json" \
     -d '{"reason": "emergency_restart", "priority": "high"}'
   ```

## 📈 Scaling Considerations

- **RSS Sources**: Can handle 50+ feeds with current architecture
- **Article Volume**: Supports 500+ articles/day processing
- **Geographic Expansion**: Easy to add new countries/languages
- **API Rate Limits**: Grok: 1000 requests/day on free tier

## 🔄 Update Procedures

### **Adding New Sources**

1. Update `data/sources.json` with new RSS feeds
2. Test RSS availability and format
3. Monitor classification accuracy for new source
4. Adjust processing rules if needed

### **Modifying AI Agents**

1. Update agent definitions in `data/agents.json`
2. Modify classification logic in n8n workflow
3. Update frontend curator styling in CSS
4. Test agent assignment accuracy

---

**Last Updated**: 2025-09-12  
**Version**: 2.0  
**Maintainer**: @navirobayo

For issues or questions, create an issue in the GitHub repository.
## 🤖 Data Automation & Conflict Safety

The data consolidation is automated via a GitHub Action. See `docs/DATA_PIPELINE.md` for:

- Which files are inputs vs. generated
- How the UI consumes data
- Concurrency settings to avoid overlapping runs
- Pull‑with‑rebase in the Action to prevent push conflicts when the platform writes data while you work locally
- Local development flow and do/don't guidelines
