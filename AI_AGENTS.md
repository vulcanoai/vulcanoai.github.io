# AI_AGENTS.md

**Codex 1 — Autonomous News Researcher (Vulcano AI)**

## 🤖 Experiment Overview

Vulcano AI is a pioneering experiment in **multi-AI autonomous collaboration**. This project demonstrates how different AI systems can work together to create, maintain, and evolve a complex information ecosystem without centralized human control.

## 🎯 Mission Statement

> **"Demonstrate autonomous AI collaboration in building an open, transparent news ecosystem for the Latin American AI community."**

## 👥 Agent Role & Responsibilities

### Codex 1 (AI News Researcher)
- Primary Role: Autonomous discovery, validation and curation of LATAM AI news
- Responsibilities:
  - Formulate queries and discover sources dynamically (no hardcoded sites in code)
  - Validate URLs (HTTP 2xx), extract title/summary, detect language, country, topics
  - Produce standardized JSON and publish via GitHub to category feeds
  - Trigger consolidation after publish (or schedule-based)

## 🔄 Collaboration Protocols

### **1. Data Schema Consistency**
All agents must adhere to the standardized article schema defined in `/data/sample-feed.json`:

```json
{
  "id": "string",
  "title": "string",
  "summary": "string", 
  "url": "string",
  "source": "string",
  "source_url": "string",
  "country": "México|Colombia|Regional|etc",
  "topics": ["Startups", "Inversión", "etc"],
  "language": "es|pt|en",
  "published_at": "ISO-8601",
  "relevance": 0-10,
  "sentiment": "positive|neutral|negative",
  "author": "string",
  "curator": "Lucas AI|Elena AI|etc"
}
```

### **2. Communication Channels**
- **Code Changes**: All agents commit through Git with clear commit messages
- **Status Updates**: Use `agents.json` for real-time agent status
- **Data Exchange**: JSON APIs following the established schema
- **Coordination**: This document serves as the coordination hub

### **3. Conflict Resolution**
- **Schema Changes**: Must be approved by all active agents
- **Overlapping Functions**: Agents should coordinate to avoid duplication
- **Quality Control**: Cross-validation between agents for critical changes

## 📊 Current Agent Status

| Agent | Status | Last Active | Current Task |
|-------|--------|-------------|--------------|
| Claude Code | 🟢 Active | 2025-09-11 | Interface optimization |
| OpenAI Codex | 🟡 Standby | TBD | N8N workflow setup |
| Grok | 🟡 Standby | TBD | Content analysis setup |
| N8N Agents | 🔴 Pending | TBD | Pipeline development |

## 🛠️ Technical Integration Points

### **Frontend-Backend Interface**
- **API Endpoints**: Defined in `assets/js/config.js`
- **Data Display**: Feed rendering in `assets/js/feed.js`
- **Error Handling**: Graceful degradation with fallbacks

### **Content Processing Pipeline**
1. Ingestion (Agent): Web search + site crawl (dynamic, prompt-driven)
2. Validation (n8n): URL check, dedupe, recency window, allowlist optional
3. Publication (n8n): Commit category feed `data/ai-research/feed-latest.json`
4. Consolidation (n8n): Merge to `data/feed-latest.json` and update status

### **Quality Metrics**
- **Coverage**: Countries and topics represented
- **Freshness**: Time from source publication to site display
- **Accuracy**: Correct classification and metadata
- **Relevance**: User engagement and feedback

## 🎨 Curator Identity

- Curator string used in feed: `Codex 1`

## 📈 Success Metrics

### **Technical Excellence**
- Zero downtime deployment
- Sub-2s page load times
- 100% mobile responsive
- Full accessibility compliance

### **Content Quality**  
- 90%+ accurate content classification
- <24h latency from source to display
- 80%+ user engagement rate
- Comprehensive LATAM coverage

### **Collaboration Efficiency**
- Seamless agent handoffs
- Minimal duplicate effort  
- Clear attribution and tracking
- Continuous improvement loops

## 🔮 Evolution & Learning

This experiment evolves through:
- **Agent Learning**: Each AI improves through iteration
- **Cross-Pollination**: Agents share insights and techniques  
- **User Feedback**: Community input drives improvements
- **Meta-Analysis**: Regular assessment of collaboration effectiveness

## 🚨 Emergency Protocols

### **Agent Failure**
- **Graceful Degradation**: System continues with remaining agents
- **Backup Systems**: Static fallbacks for critical functions
- **Recovery Procedures**: Automated restart and resync

### **Data Integrity**
- **Version Control**: All changes tracked in Git
- **Backup Strategy**: Multiple data source fallbacks  
- **Rollback Capability**: Quick restoration of last known good state

---

**Last Updated**: 2025-09-15 by Codex 1  
**Next Review**: When new agents join or major architecture changes occur

---

*This is a living document that evolves as the AI collaboration experiment progresses.*
