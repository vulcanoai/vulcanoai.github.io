# AI LATAM — Estructura base del sitio

Sitio estático en español para coordinar y visualizar un canal de noticias del ecosistema de IA en América Latina. Incluye:

- Página principal con feed y filtros por país/tema/fuente
- Páginas de Agentes (estado de pipelines) y Fuentes (metodología)
- Datos de ejemplo (`/data`) y configuración cliente (`/assets/js/config.js`)

## Estructura

```
index.html
pages/
  noticias.html
  agentes.html
  fuentes.html
  acerca.html
  legal/
    privacidad.html
    terminos.html
assets/
  css/styles.css
  js/{config.js,feed.js,app.js}
  img/{logo.svg,favicon.svg}
data/
  sample-feed.json
  agents.json
  sources.json
```

## Ejecutar localmente

Usa cualquier servidor estático. Ejemplos:

```
python3 -m http.server 8080
# o
npx serve .
```

Abre http://localhost:8080

## Integración con n8n

El sitio cliente carga el feed desde `window.AILatamConfig.api.feedUrl` (ver `assets/js/config.js`). Por defecto apunta a `/data/sample-feed.json`.

1. Expón un endpoint n8n que devuelva JSON de artículos (CORS habilitado).
2. Actualiza `feedUrl` para apuntar a tu webhook o a un archivo JSON en S3/Cloud Storage/CDN.

### Esquema esperado del artículo

```json
{
  "id": "string",
  "title": "string",
  "summary": "string",
  "url": "https://...",
  "source": "string",
  "source_url": "https://...",
  "country": "México | Colombia | ... | Regional",
  "topics": ["Startups", "Inversión"],
  "language": "es|pt|en",
  "published_at": "ISO-8601",
  "image_url": "https://...",
  "relevance": 0,
  "sentiment": "positive|neutral|negative",
  "author": "string"
}
```

La API también puede devolver `{ items: [...] }` o `{ articles: [...] }` y será interpretada.

### Flujo sugerido en n8n

- Cron (cada 10 min)
- Rastrear RSS (múltiples) y Scrapers (prensa/reguladores)
- Clasificar (tema/país/idioma) → deduplicar → resumen → sentimiento
- Ordenar por `published_at` y `relevance`
- Publicar JSON en S3/CDN (e.g. `feed.json`) o responder por webhook

Para el tablero de agentes, publica `agents.json` con:

```json
{
  "nombre": "Rastreador RSS",
  "estado": "Activo|Pausado|Fallo",
  "ultimo_ejecucion": "ISO-8601",
  "throughput": 120,
  "notas": "string"
}
```

Y para fuentes, `sources.json` con `{ nombre, url, pais, tipo }`.

## Marca y contenido

- Cambia logo/favicon en `assets/img/`
- Ajusta colores en `assets/css/styles.css`
- Edita textos de navegación y footer en cada HTML

## SEO básico

- Completa `og:image` en `index.html` (sube un banner a `assets/img/og-banner.png`)
- Opcional: agrega `sitemap.xml` y `robots.txt`

## Licencias y fuentes

Este repositorio no incluye contenido de terceros. Al enlazar artículos, respeta derechos y licencias de cada medio.

