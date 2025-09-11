# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vulcano AI is a static website for AI news aggregation and curation in Latin America. It's built with pure HTML/CSS/JavaScript with no frameworks, build tools, or external dependencies for security and simplicity.

## Development Commands

**Local Development Server:**
```bash
# Start local server (choose one)
python3 -m http.server 8080
# or
npx serve .
# Then open: http://localhost:8080
```

**No Build Process**: This project intentionally avoids package managers, build tools, or transpilation. All code is vanilla web standards.

## Architecture

**Core Technologies:**
- Pure HTML5, CSS3, ES6+ JavaScript
- Static JSON data files with external API integration
- GitHub Pages deployment
- n8n automation workflows for content curation

**Key Directories:**
- `pages/` - Individual page templates (noticias, panorama, observatorio-legal, etc.)
- `assets/js/` - Modular JavaScript (app.js, feed.js, config.js, logo.js)
- `assets/css/styles.css` - Single stylesheet with CSS custom properties
- `data/` - JSON data files for feeds, sources, agents status
- `assets/icons.svg` - SVG sprite for all icons

**Configuration Hub**: `assets/js/config.js` centralizes:
- API endpoints and feed URLs
- Navigation structure
- Social media links and donation platforms
- External integration settings

## Data Architecture

**Feed Structure**: Articles follow this schema:
```javascript
{
  "id": "string",
  "title": "string",
  "summary": "string", 
  "url": "https://...",
  "source": "string",
  "country": "México|Colombia|Regional",
  "topics": ["Startups", "Inversión"],
  "language": "es|pt|en",
  "published_at": "ISO-8601",
  "relevance": 0-10,
  "sentiment": "positive|neutral|negative"
}
```

**Daily Snapshots**: Feed data uses date-based naming (e.g., `feed-2025-09-08.json`)

## Security Policies

- **Strict CSP**: No external resource loading by default
- **No Images**: SVG icons only, no stock photography
- **Defensive Coding**: Always check element existence before DOM manipulation
- **No innerHTML with External Data**: Prevent XSS attacks
- **Code Review Required**: All changes to data/, config files, and forms

## Spanish Interface

The entire interface is in Spanish targeting Latin American users. Maintain consistent terminology and regional language preferences.

## Key Features

- **Multi-source News Aggregation**: RSS and web scraping with automated classification
- **Legal Observatory**: Regulatory tracking across Latin America (país-specific pages)
- **Agent Dashboard**: Status monitoring for automation pipelines  
- **Community Submissions**: Independent article submission system
- **Content Filtering**: By country, topic, source, language, sentiment

## Code Owner

Primary maintainer: @navirobayo - all changes require review per CODEOWNERS file.