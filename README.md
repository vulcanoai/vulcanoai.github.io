# Vulcano Ai — Estructura base del sitio

Sitio estático en español para coordinar y visualizar un canal de noticias del ecosistema de IA en América Latina. Incluye:

- Página principal con feed y filtros por país/tema/fuente
- Páginas de Agentes (estado de pipelines) y Fuentes (metodología)
- Páginas nuevas: Panorama (categorías y automatización) y Observatorio legal
- Envíos independientes con formulario + PR a GitHub
 - Página “Qué es Vulcano AI” con historia, colaboración y entidad legal
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
  icons.svg
  img/{favicon.svg}
data/
  sample-feed.json
  agents.json
  sources.json
  panorama.json
  legal-sample.json
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

Para envíos independientes (formulario), configura un webhook en `AILatamConfig.api.indieSubmitUrl` que reciba POST JSON. Si no está configurado, el sitio mostrará la ruta de Pull Request como alternativa principal.

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

### Observatorio legal (propuesta)

Publicar `legal.json` con el siguiente esquema mínimo:

```json
{
  "pais": "Brasil",
  "titulo": "PL 2338/2023 — Marco de IA",
  "estado": "Borrador|Debate|Aprobado|Reglamentación|Consulta",
  "fecha": "ISO-8601",
  "url": "https://…",
  "resumen": "texto breve",
  "organismo": "Senado|Ministerio|Agencia",
  "temas": ["riesgo", "transparencia", "deepfakes"]
}
```

Sugerencias de agentes: rastreadores por país (Senado/Cámara, diarios oficiales), alertas de palabras clave, deduplicación y normalización de estados.

### Panorama (categorías)

`panorama.json` describe categorías, elementos clave y fuentes/automatización. Los agentes pueden actualizarlo o generar variantes por país.

### Envíos independientes

- Página: `pages/independiente.html`
- Formulario envía JSON a `api.indieSubmitUrl` con: `{ tipo:"independiente", title, author, email, country, topics[], url, summary, license, agreement }`.
- Alternativa: Pull Request al repo `vulcanoai/vulcanoai.github.io` creando archivos en `submissions/independiente/AAAA-MM/*.json`.

## Notas de mantenimiento asistido por IA

- Los archivos JS incluyen comentarios "TODO" y puntos de extensión.
- Mantener consistencia en campos y normalizadores (ver `assets/js/feed.js`).
- Si se crece, considerar un generador estático (Eleventy, Astro) para reusar layouts.

## Marca y contenido

- Sin fotografías/stock. La UI usa iconos en `assets/icons.svg` (heredan `currentColor`).
- Cambia favicon en `assets/img/`
- Ajusta colores en `assets/css/styles.css`
- Edita textos de navegación y footer en cada HTML
 - Línea legal usada en footer: “Vulcano Ai Digital Solutions S.A.S - 2025 Todos los derechos reservados”

## SEO básico

- Define `og:image` en `index.html` (puedes usar un SVG ligero `assets/img/og-banner.svg`)
- Opcional: agrega `sitemap.xml` y `robots.txt`

## Licencias y fuentes

Este repositorio no incluye contenido de terceros. Al enlazar artículos, respeta derechos y licencias de cada medio.

## Modelo de publicación y seguridad

- Sitio estático, sin claves en el cliente. Secretos viven en n8n.
- Por defecto, el cliente solo lee `data/*.json` incluidos en el repo (resultado de PRs aprobados).
- Opcional: usar un CDN de solo lectura para `feedUrl`/`legalUrl`/`panoramaUrl`. Restringe CORS al dominio del sitio.
- CSP estricta en HTML: si apuntas a endpoints externos, añade su origen a `connect-src`.
- Recomendado: que n8n cree PRs con cambios de datos (para revisión y trazabilidad) en lugar de publicar directo.

Consulta `SECURITY.md` para detalles y práctica recomendada.
