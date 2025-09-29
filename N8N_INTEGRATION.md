# N8N_INTEGRATION.md

**N8N Workflow Integration Guide for Vulcano AI**

## 🔗 Overview

This document specifies how N8N workflows integrate with the Vulcano AI frontend and defines the automation pipeline architecture for autonomous content curation.

## 📊 Data Flow Architecture

```
[RSS Sources] → [N8N Workflows] → [Processing Agents] → [API Endpoints] → [Frontend Display]
```

### **Pipeline Stages**

1. **Ingestion Stage** (N8N)
2. **Processing Stage** (AI Agents)  
3. **Publishing Stage** (API)
4. **Display Stage** (Frontend)

## 🔄 N8N Workflow Specifications

### **Core Workflows Required (v2.0)**

#### **1. Startups Feed (baseline)**
- **Trigger**: Scheduled (hourly)
- **Sources**: Contxto, Startupi, Startups.com.br (HTTP + parse)
- **Output**: `data/startups/feed-latest.json`
- **File**: `workflows/STARTUPS_FEED_AUTOPILOT_fixed.json`

#### **2. AI Research Feed**  
- **Trigger**: Scheduled (hourly)
- **Sources**: arXiv Atom (cs.AI, cs.LG, stat.ML)
- **Output**: `data/ai-research/feed-latest.json`
- **File**: `workflows/AI_RESEARCH_FEED_AUTOPILOT_fixed.json`

#### **3. Merge & Clean (publication)**
- **Trigger**: On demand (webhook) or scheduled
- **Process**: Merge category feeds, validate URLs (2xx/3xx), dedupe, recency filter
- **Output**: `data/feed-latest.json` (only)
- **File**: `workflows/MERGE_AND_CLEAN_GLOBAL_FEED_fixed.json`

#### **4. Agent Status Monitoring**
- **Trigger**: Scheduled (every 5 minutes)
- **Process**: Check pipeline health, update status
- **Output**: Agent status updates
- **File**: `workflows/agent-monitoring.json`

## 📁 Expected File Structure

```
/n8n/
├── workflows/
│   ├── news-aggregation.json
│   ├── content-classification.json  
│   ├── publication.json
│   ├── agent-monitoring.json
│   └── data-backup.json
├── schemas/
│   ├── article-schema.json
│   ├── source-schema.json
│   └── agent-status-schema.json
└── configs/
    ├── sources.json
    ├── classification-rules.json
    └── api-endpoints.json
```

## 🔌 API Integration Points

### **Frontend Configuration (v2.0)**
Located in: `assets/js/config.js`

```javascript
api: {
  baseUrl: 'https://your-n8n-webhook-domain.com',
  endpoints: {
    feedUrl: '/data/feed-latest.json',    // Latest articles (no fallbacks)
    agentsUrl: '/webhook/agent-status',   // Agent status  
    searchUrl: '/webhook/search',         // Live search
    updateUrl: '/webhook/trigger-update'  // Manual updates
  }
}
```

### **Expected API Responses**

#### **Feed Endpoint** (`/data/feed-latest.json`)
```json
{
  "status": "success",
  "timestamp": "2025-09-11T12:00:00Z",
  "count": 25,
  "articles": [
    {
      "id": "unique-article-id",
      "title": "Article title",
      "summary": "Brief summary",
      "url": "https://source.com/article",
      "source": "Source name",
      "source_url": "https://source.com",
      "country": "México",
      "topics": ["Startups", "Inversión"],
      "language": "es",
      "published_at": "2025-09-11T10:00:00Z",
      "relevance": 8,
      "sentiment": "positive",
      "author": "Author Name",
      "curator": "Codex 1"
    }
  ]
}
```

#### **Agent Status Endpoint** (`/webhook/agent-status`)
```json
{
  "status": "success",
  "timestamp": "2025-09-11T12:00:00Z",
  "agents": [
    {
      "id": "rss-aggregator",
      "name": "RSS Aggregator",
      "status": "active",
      "last_run": "2025-09-11T11:30:00Z",
      "articles_processed": 156,
      "success_rate": 0.98,
      "next_run": "2025-09-11T12:00:00Z"
    },
    {
      "id": "content-classifier",  
      "name": "Content Classifier",
      "status": "active",
      "last_run": "2025-09-11T11:35:00Z",
      "articles_processed": 148,
      "success_rate": 0.95,
      "next_run": "2025-09-11T12:05:00Z"
    }
  ]
}
```

## 🎯 Content Sources Configuration

### **RSS Sources** (`/n8n/configs/sources.json`)
```json
{
  "sources": [
    {
      "id": "bloomberg-latam",
      "name": "Bloomberg Línea",
      "url": "https://www.bloomberglinea.com/feed/",
      "country": "Regional",
      "language": "es",
      "priority": 9,
      "topics": ["Inversión", "Empresas", "Startups"]
    },
    {
      "id": "gobierno-colombia",
      "name": "MinTIC Colombia", 
      "url": "https://www.mintic.gov.co/portal/inicio/Sala-de-Prensa/",
      "country": "Colombia",
      "language": "es", 
      "priority": 8,
      "topics": ["Gobierno", "Regulación", "Política pública"]
    }
  ]
}
```

### **Classification Rules** (`/n8n/configs/classification-rules.json`)
```json
{
  "country_keywords": {
    "México": ["méxico", "mexican", "cdmx", "guadalajara"],
    "Colombia": ["colombia", "bogotá", "medellín", "cali"],
    "Brasil": ["brasil", "brazil", "são paulo", "rio de janeiro"],
    "Argentina": ["argentina", "buenos aires", "córdoba"],
    "Chile": ["chile", "santiago", "valparaíso"]
  },
  "topic_keywords": {
    "Startups": ["startup", "emprendimiento", "nueva empresa"],
    "Inversión": ["inversión", "funding", "capital", "ronda"],
    "Regulación": ["regulación", "ley", "norma", "política"],
    "Investigación": ["investigación", "universidad", "estudio"]
  },
  "sentiment_indicators": {
    "positive": ["éxito", "crecimiento", "innovación", "logro"],
    "negative": ["crisis", "problema", "falla", "error"],
    "neutral": ["anuncia", "publica", "presenta", "informa"]
  }
}
```

## ⚙️ N8N Node Configurations

### **Essential Nodes**

#### **RSS Feed Reader Node**
{% raw %}
```json
{
  "parameters": {
    "feedUrl": "={{$json.url}}",
    "pollTimes": {
      "mode": "everyMinute",
      "value": 30
    },
    "options": {
      "ignoreSSL": false,
      "useCache": true
    }
  }
}
```
{% endraw %}

#### **HTTP Request Node (Classification)**  
{% raw %}
```json
{
  "parameters": {
    "method": "POST",
    "url": "https://api.openai.com/v1/chat/completions",
    "authentication": "headerAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "Bearer {{$secrets.OPENAI_API_KEY}}"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "model", 
          "value": "gpt-3.5-turbo"
        },
        {
          "name": "messages",
          "value": "={{$json.classification_prompt}}"
        }
      ]
    }
  }
}
```
{% endraw %}

#### **Webhook Response Node**
{% raw %}
```json
{
  "parameters": {
    "responseMode": "responseNode", 
    "responseData": "={{$json.processed_articles}}",
    "options": {
      "responseHeaders": {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    }
  }
}
```
{% endraw %}

## 🔒 Security Configuration

### **Environment Variables**
```bash
OPENAI_API_KEY=sk-...
GROK_API_KEY=gsk_...
WEBHOOK_SECRET=secure-random-string
DATABASE_URL=postgres://...
CORS_ORIGINS=https://vulcano.ai,https://vulcanoai.github.io
```

### **Webhook Security**
- Use webhook secrets for authentication
- Implement rate limiting (10 requests/minute per IP)
- Validate all incoming data against schemas
- Log all requests for monitoring

## 📈 Monitoring & Analytics

### **Key Metrics to Track**
- **Articles processed per hour**
- **Classification accuracy rate**  
- **Source response times**
- **API endpoint latency**
- **Error rates and types**
- **Content freshness (time from source to display)**

### **Health Checks**
- Ping endpoints every 5 minutes
- Alert if any workflow fails
- Monitor disk space and memory usage
- Track database connection health

## 🚨 Error Handling

### **Graceful Degradation**
- **RSS Source Down**: Continue with other sources
- **Classification API Error**: Use fallback keywords
- **Database Error**: Cache locally and retry
- **Webhook Timeout**: Queue for retry with exponential backoff

### **Retry Strategies**
- **Immediate retry**: Network timeouts (3 attempts)
- **Delayed retry**: Rate limit errors (5 minutes)
- **Skip and log**: Malformed content (manual review)

## 🔄 Deployment Strategy

### **Development Workflow**
1. **Local N8N**: Test workflows locally first
2. **Staging Environment**: Deploy to test instance  
3. **Production Deploy**: Update live workflows
4. **Monitoring**: Watch for errors and performance

### **Backup Strategy**  
- **Daily Exports**: All workflow configurations
- **Data Backup**: Article database snapshots
- **Version Control**: Track all workflow changes in Git

---

**Last Updated**: 2025-09-11 by Claude Code  
**Next Review**: When N8N workflows are first deployed

---

*This document should be updated whenever N8N workflow configurations change.*
