# AI_COMMENTS.md

**Centralized AI Development Notes & Technical TODOs**

## 🎯 Purpose

This file centralizes all AI-related development notes, TODOs, and technical comments that were previously scattered throughout the codebase. This improves collaboration between multiple AI agents working on the project.

## 📋 Active TODOs

### **High Priority**
- **[feed.js:69]** `TODO(automation)`: Implement compression support (gzip/br) and ETag/If-None-Match headers for feed endpoints
- **[N8N Integration]** Complete workflow setup for automated content classification
- **[Agent Status]** Implement real-time agent status monitoring dashboard

### **Medium Priority**  
- **[Panorama Pages]** Replace placeholder content with agent-generated category data
- **[Legal Observatory]** Implement structured legal document processing
- **[Search Enhancement]** Improve live search with better ranking algorithms

### **Low Priority**
- **[Performance]** Add service worker for offline functionality
- **[Analytics]** Implement privacy-friendly usage analytics
- **[Accessibility]** Add keyboard navigation improvements

## 🔧 Technical Implementation Notes

### **Feed Processing Pipeline**
```javascript
// From feed.js - Current normalization logic
const normalize = (a) => ({
  id: a.id || crypto.randomUUID(),
  title: a.title || a.titulo || 'Sin título',
  summary: a.summary || a.resumen || '',
  url: a.url || a.link || '#',
  source: a.source || a.fuente || '—',
  country: a.country || a.pais || 'Regional',
  topics: a.topics || a.temas || [],
  language: a.language || a.idioma || 'es',
  published_at: a.published_at || a.fecha || new Date().toISOString(),
  relevance: a.relevance || a.relevancia || 0,
  sentiment: a.sentiment || a.sentimiento || 'neutral',
  author: a.author || a.autor || '',
  curator: a.curator || a.curador || 'Lucas AI'
});
```

**Agent Notes:**
- Supports both Spanish and English field names for flexibility
- Auto-generates UUIDs for missing article IDs
- Defaults to 'Lucas AI' as curator for consistency
- Regional classification falls back to 'Regional' for broad content

### **Agent Configuration Management**
```javascript
// From config.js - Central configuration hub
window.AILatamConfig = {
  api: {
    baseUrl: 'https://api.vulcano.ai',
    feedUrl: '/data/sample-feed.json',      // Will be replaced by N8N endpoint
    agentsUrl: '/data/agents.json',         // Real-time agent status
    sourcesUrl: '/data/sources.json',       // Source configuration
    legalUrl: '/data/legal-sample.json'     // Legal documents feed
  }
  // ... more config
}
```

**Agent Notes:**
- All API endpoints centralized for easy N8N integration
- Fallback URLs point to static JSON for development
- CORS-enabled endpoints required for production

### **Content Classification Logic**
```javascript
// From app.js - Content processing hints
const mapCountryToSlug = (country) => {
  // Maps country names to CSS-friendly slugs
  // Used for thematic styling and filtering
}

const getCuratorClass = (curator) => {
  // Maps curator names to visual styles
  // Supports 11 different AI personality themes
}
```

**Agent Notes:**
- Country and topic classification drives visual theming
- Each curator AI has distinct visual identity
- Classification should be consistent across all processing agents

## 🤖 Agent-Specific Implementation Notes

### **Claude Code (Current)**
- **Frontend Architecture**: Vanilla JavaScript with no framework dependencies
- **Responsive Design**: Mobile-first with CSS Grid and Flexbox
- **Security**: Strict CSP headers, no external dependencies
- **Performance**: Optimized for fast loading with minimal JavaScript

### **OpenAI Codex (Pending)**
- **N8N Workflows**: Should focus on RSS aggregation and content processing
- **API Design**: RESTful endpoints following existing schema
- **Error Handling**: Graceful degradation with fallback data sources
- **Rate Limiting**: Implement proper throttling for external APIs

### **Grok (Pending)**  
- **Content Analysis**: Sentiment, relevance, and topic classification
- **Regional Context**: LATAM-specific knowledge and cultural nuances
- **Language Detection**: Support for Spanish, Portuguese, and English
- **Quality Scoring**: Relevance ranking from 0-10

### **N8N Agents (Pending)**
- **Scheduling**: 30-minute intervals for RSS aggregation
- **Data Transformation**: Convert various source formats to standard schema
- **Deduplication**: Prevent duplicate articles across sources
- **Publishing**: Atomic updates to prevent partial state issues

## 📊 Data Schema Evolution

### **Current Article Schema** (v1.0)
```json
{
  "id": "string",
  "title": "string",
  "summary": "string",
  "url": "string", 
  "source": "string",
  "source_url": "string",
  "country": "string",
  "topics": ["string"],
  "language": "string",
  "published_at": "ISO-8601",
  "relevance": 0-10,
  "sentiment": "positive|neutral|negative",
  "author": "string",
  "curator": "string"
}
```

### **Proposed Enhancements** (v2.0)
```json
{
  // ... existing fields
  "processing_metadata": {
    "ingestion_time": "ISO-8601",
    "classification_confidence": 0.0-1.0,
    "source_reliability": 0.0-1.0,
    "duplicate_check": "boolean"
  },
  "engagement_metrics": {
    "clicks": "number",
    "shares": "number", 
    "reading_time_estimate": "number"
  }
}
```

## 🔍 Code Quality & Standards

### **JavaScript Patterns**
- **IIFE Modules**: All JavaScript wrapped in immediately-invoked functions
- **Defensive Programming**: Always check element existence before manipulation
- **Error Boundaries**: Try-catch blocks around all async operations
- **No Global Pollution**: All code scoped properly

### **CSS Architecture**
- **CSS Custom Properties**: All colors and spacing tokenized
- **Mobile-First**: All breakpoints start mobile and scale up
- **Component-Based**: Reusable classes with clear naming
- **Dark Theme**: Single theme with accessible contrast ratios

### **HTML Structure**  
- **Semantic Markup**: Proper heading hierarchy and ARIA labels
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Security Headers**: Strict CSP prevents XSS attacks
- **Performance**: Minimal DOM structure for fast rendering

## 🚨 Critical Agent Coordination Points

### **Data Consistency**
- All agents must validate against the same JSON schema
- Timestamps must be ISO-8601 format in UTC
- Country names must match the predefined list
- Topic classifications should be consistent

### **API Coordination**
- N8N endpoints must be CORS-enabled for browser access
- Response format must match existing structure
- Error responses should include helpful debugging info
- Rate limiting should be coordinated across agents

### **Content Quality**
- Duplicate detection across all ingestion sources
- Content must be LATAM-relevant (not global AI news)
- Spanish/Portuguese content preferred over English
- Source credibility scoring for reliability

## 📝 Development History & Decisions

### **2025-09-11: Multi-AI Architecture Established**
- **Decision**: Implement multi-AI collaboration experiment
- **Rationale**: Demonstrate autonomous AI coordination capabilities
- **Implementation**: Created structured documentation and communication protocols

### **2025-09-11: Homepage Redirect Strategy**  
- **Decision**: Redirect homepage to news feed directly
- **Rationale**: News feed is more functional than marketing homepage
- **Implementation**: JavaScript + meta refresh for maximum compatibility

### **2025-09-11: Scientific Messaging Update**
- **Decision**: Change from "human verification" to "autonomous AI processing"
- **Rationale**: Accurately represent the AI-first approach of the project
- **Implementation**: Updated taglines across all pages and metadata

## 🔮 Future Architecture Considerations

### **Scalability Planning**
- **Database**: Consider moving from JSON files to PostgreSQL
- **Caching**: Implement Redis for frequently accessed content
- **CDN**: Static assets should be served from CDN
- **Monitoring**: Real-time agent health and performance tracking

### **Advanced Features**
- **Personalization**: User-specific content filtering and recommendations
- **Real-time Updates**: WebSocket connections for live content updates
- **Mobile App**: Native mobile application for better user experience
- **API Access**: Public API for developers to access the curated content

---

**Last Updated**: 2025-09-11 by Claude Code  
**Next Review**: When new agents join or significant architecture changes occur

---

*This document should be updated whenever significant technical decisions are made or new TODOs are identified.*