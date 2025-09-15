# Vulcano AI — Plataforma de noticias IA para LATAM

Estado: Producción activa (Versión 2.0). Este repositorio contiene el sitio estático (GitHub Pages), los artefactos de datos (`/data`) y los flujos n8n usados para automatizar el feed y sociales.

• Frontend: HTML/CSS/JS puro (sin dependencias externas)
• Datos: JSON versionados en `data/` (abiertos y reproducibles)
• Automatización: n8n publica y consolida contenido; scripts locales y CI generan índices y snapshots

## Arquitectura

```
[Fuentes RSS/Agentes] → [n8n Autopilots] → [Commits a /data] → [CI build-feed] → [GitHub Pages] → [Frontend]
```

- n8n obtiene, clasifica (Grok/LLMs), deduplica y publica JSON a este repo (vía API GitHub).
- `scripts/build-feed.js` consolida y genera `feed-latest.json`, `feed-YYYY-MM-DD.json`, índices y trazabilidad por artículo en `entries/`.
- Versión 2.0 (reset‑first): el sitio lee SOLO `data/feed-latest.json` (sin fallbacks). El feed puede estar vacío mientras se valida la nueva canalización.

## Estructura del repositorio

```
index.html
assets/js/{config.js, app.js, feed.js, logo.js}
assets/css/styles.css
pages/*.html (noticias, archivo, agentes, fuentes, observatorio, etc.)
data/ (feed-latest.json, feed-YYYY-MM-DD.json, runs/, entries/, index/, sources.json, agents.json)
n8n/workflows/*.json (producción, tests y borradores)
scripts/ (build-feed.js, validadores, backfill, hooks)
docs/ (pipeline, layouts, guías de workflows)
```

## Datos y archivos generados

Generados por CI/script (`scripts/build-feed.js`):

- `data/feed-latest.json` — Feed consolidado (ordenado por `published_at`). En v2.0, este es el ÚNICO origen consumido por el frontend.
- `data/feed-YYYY-MM-DD.json` — Snapshot diario por fecha de descubrimiento.
- `data/index/by-country.json`, `by-topic.json`, `by-source.json` — Agregaciones.
- `data/index/catalog.json` — Días disponibles.
- `data/index/runs.json` — Manifest de ejecuciones.
- `data/index/status.json` — Estado/frescura del feed.
- `data/stories/YYYY-MM-DD.json` y `data/index/stories.json` — Agrupación por historias.
- `data/entries/YYYY-MM-DD/index.json` y `data/entries/YYYY-MM-DD/*.json` — Trazabilidad por artículo y día.

Entradas (insumos que se editan/añaden): `data/runs/*.json` (agentes), `data/indie/*.json` (envíos independientes).

Esquemas: ver `docs/schemas/*.json` y contratos en `docs/DATA_LAYOUT.md`.

## Workflows n8n en producción

Carpeta: `n8n/workflows/`

- `PRODUCTION_FEED_NEWS_AUTOPILOT.json` — Pipeline de noticias (ingestión RSS, clasificación, publicación a GitHub).
- `PRODUCTION_SOCIAL_AUTOPILOT.json` — Publicaciones sociales con pulido/validación.
- `PRODUCTION_SOCIAL_WEEKLY_REPORT.json` — Resumen semanal por temas/países.
- Borradores/tests: `DRAFT_SOCIALMEDIA_LEGACY.json`, `SOCIALMEDIA_*_TEST_vYYYYMMDD-HHMM.json`.

Normas y ciclo de vida: `docs/N8N_WORKFLOW_GUIDELINES.md` y `n8n/README.md`.

## Configuración del sitio (cliente)

Archivo: `assets/js/config.js` (`window.AILatamConfig`).

- `api.feedUrl`: por defecto `/data/feed-latest.json` (CORS no requerido en Pages).
- Opcional: `indieSubmitUrl`, `searchAgentUrl`, `updateTriggerUrl` para integrar webhooks n8n o serverless.
- Otras fuentes: `agentsUrl`, `sourcesUrl`, `panoramaUrl`, `legalUrl`.

Frontend v2.0: solo `latest` (sin snapshots/runs/sample para evitar reintroducir datos obsoletos).

## Ejecutar localmente

Servidor estático (cualquiera):

```
python3 -m http.server 8080
# o
npx serve .
```

Abrir `http://localhost:8080`.

Reconstruir datos localmente (opcionales):

```
VULCANO_ALLOW_LOCAL_DATA_WRITE=1 node scripts/build-feed.js
# Variables útiles:
#   FEED_MAX_AGE_DAYS=180  (filtrado por antigüedad)
#   VERIFY_LINKS=0         (desactivar verificación HTTP de enlaces)
```

Guía completa de deployment y webhooks: `DEPLOYMENT.md`.

## Integración n8n

Guías detalladas: `N8N_SETUP.md` y `N8N_INTEGRATION.md`.

- El workflow estable publica: `data/runs/`, `data/entries/YYYY-MM-DD/`, `data/feed-latest.json`, `data/feed-YYYY-MM-DD.json` e índices.
- Requiere credenciales en n8n (Grok/X.AI, GitHub, etc.). No hay secretos en este repo.
- Naming y promoción de builds: ver `n8n/README.md`.

## Seguridad y buenas prácticas

- Sin claves en el cliente; secretos viven en credenciales de n8n / variables de entorno.
- CSP estricta en HTML; si usas endpoints externos, añade su origen a `connect-src`.
- `scripts/build-feed.js` escribe de forma idempotente y atómica; CI evita solapes con `concurrency`.
- Preferir PRs generados por agentes sobre escrituras directas a `main` para trazabilidad.

Más en `SECURITY.md` y `docs/DATA_PIPELINE.md` (seguridad de concurrencia y contratos de datos).

## Documentación relacionada

- `docs/DATA_LAYOUT.md` — Contrato y distribución de archivos en `data/`.
- `docs/DATA_PIPELINE.md` — Flujo de consolidación, entradas vs. generados y CI.
- `docs/WORKFLOW_DEBUG007.md` — Notas del workflow estable.
- `docs/LOCAL_DEV_DATA.md` — Guardas para no versionar data generada en dev.
- `n8n/README.md` — Normas de workflows, nombres y promoción a producción.

## Canales y soporte

- WhatsApp: `https://wa.me/573193620926`
- X/Twitter: `https://x.com/VulcanoAi`
- LinkedIn: `https://www.linkedin.com/company/vulcano-ai/`

—

Mantenido por Vulcano Ai Digital Solutions S.A.S. 2025.
- Instagram: https://instagram.com/vulcanoai.solutions
- X (Twitter): https://x.com/VulcanoAi
- LinkedIn: https://www.linkedin.com/company/vulcano-ai/

Página dedicada: `pages/actualizaciones.html`. El formulario compone el mensaje y abre WhatsApp con el texto sugerido. La frecuencia no se guarda en el cliente; el manejo se realiza en n8n/WA Business.

### n8n (sugerido)

- Webhook WA Business/Cloud API ↔ n8n: parsear mensajes “ALTA DIARIO/SEMANAL” y “BAJA”.
- Lista de envíos (diaria/semanal) + publicación de resúmenes en WhatsApp.
- Opcional: confirmación y ayuda automatizada.

### Snapshots diarios del feed

- Convención de archivos: `data/feed-YYYY-MM-DD.json` (ej. `data/feed-2025-09-08.json`).
- `assets/js/config.js` puede apuntar al snapshot del día. Si el archivo no existe, el cliente hace fallback a `data/sample-feed.json`.
- Esquema de artículo: ver más arriba. Mantener `published_at` en ISO‑8601.
- Recomendado: que n8n genere el archivo del día (CDN o PR) y, opcionalmente, actualice un alias estable `data/feed.json`.
