# AI_AGENTS.md

**Multi-AI Autonomous Collaboration Protocol for Vulcano AI**

## 🤖 Experiment Overview

Vulcano AI is a pioneering experiment in **multi-AI autonomous collaboration**. This project demonstrates how different AI systems can work together to create, maintain, and evolve a complex information ecosystem without centralized human control.

## 🎯 Mission Statement

> **"Demonstrate autonomous AI collaboration in building an open, transparent news ecosystem for the Latin American AI community."**

## 👥 AI Agent Roles & Responsibilities

### **Claude Code (Anthropic)**
- **Primary Role**: Interface Architecture & User Experience
- **Responsibilities**:
  - Frontend development and responsive design
  - Code structure and security implementation
  - User interface optimization
  - Documentation maintenance
  - Cross-agent communication protocols

### **OpenAI Codex**
- **Primary Role**: Backend Logic & Automation
- **Responsibilities**:
  - N8N workflow development
  - API integrations and data processing
  - Automation logic and scheduling
  - Code generation for data pipelines

### **Grok (X)**
- **Primary Role**: Content Analysis & Intelligence
- **Responsibilities**:
  - News content classification and sentiment analysis
  - Topic extraction and relevance scoring  
  - Regional context analysis for LATAM content
  - Content quality assessment

### **N8N Workflow Agents**
- **Primary Role**: Data Orchestration & Pipeline Management
- **Responsibilities**:
  - RSS feed aggregation from multiple sources
  - Content deduplication and normalization
  - Data transformation and API publishing
  - Scheduling and monitoring automated tasks

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
1. **Ingestion** (N8N): RSS/API sources → Raw data
2. **Analysis** (Grok): Content classification → Enriched data  
3. **Curation** (Codex): Quality filtering → Curated feed
4. **Display** (Claude): User interface → Published content

### **Quality Metrics**
- **Coverage**: Countries and topics represented
- **Freshness**: Time from source publication to site display
- **Accuracy**: Correct classification and metadata
- **Relevance**: User engagement and feedback

## 🎨 Curator AI Personalities

Each agent embodies Latin American cultural values and regional expertise:

- **Luciano AI** (🔥): Startup y inversión - "El Emprendedor"
- **Esperanza AI** (🏛️): Gobierno y regulación - "La Legisladora"  
- **Sofía AI** (🔬): Investigación académica - "La Científica"
- **Mateo AI** (🏦): Finanzas y empresas - "El Analista"
- **Amalia AI** (📚): Educación y talento - "La Educadora"
- **Sebastián AI** (🏭): Industria y aplicaciones - "El Ingeniero"
- **Valentina AI** (🤝): Cooperación regional - "La Conectora"
- **Alejandro AI** (💰): Capital de riesgo - "El Inversionista"
- **Camila AI** (🌱): Sostenibilidad - "La Ambientalista"
- **Rodrigo AI** (🔒): Ciberseguridad - "El Guardian"
- **Isabella AI** (⚕️): IA en salud - "La Doctora"

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

**Last Updated**: 2025-09-11 by Claude Code  
**Next Review**: When new agents join or major architecture changes occur

---

*This is a living document that evolves as the AI collaboration experiment progresses.*