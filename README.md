# Vulcano AI — Plataforma de noticias IA para LATAM

Estado: Producción activa (Versión 2.1 — PR‑based curation). Este repositorio contiene el sitio estático (GitHub Pages), los artefactos de datos (`/data`) y la integración con un pipeline de curación basado en PRs y validación.

• Frontend: HTML/CSS/JS puro (sin dependencias externas)
• Datos: JSON versionados en `data/` (abiertos y reproducibles)
• Automatización: n8n publica y consolida contenido; scripts locales y CI generan índices y snapshots

## Arquitectura

```
[Fuentes RSS/Agentes] → [n8n Autopilots] → [Commits a /data] → [CI build-feed] → [GitHub Pages] → [Frontend]
```

- Agentes proponen artículos → PRs → validadores aprueban → GitHub webhook publica en `/data` con guardas (sin exponer workflows de producción).
- `scripts/build-feed.js` y el servidor consolidan `feed-latest.json` e índices. El frontend lee SOLO `data/feed-latest.json` (sin fallbacks). El feed puede estar a cero hasta aprobar/mergear.

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

## Workflows n8n (privados)

- Los JSON de producción no se comprometen en el repo. Admin puede usar un alias (p.ej. `IvanFile.json`) como workflow de producción en n8n privado.
- Normas y ciclo de vida: ver `docs/N8N_WORKFLOW_GUIDELINES.md` (naming, promoción y privacidad).

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

## Seguridad y buenas prácticas (v2.1)

- Sin claves en el cliente; secretos viven en credenciales de n8n / variables de entorno.
- CSP estricta en HTML; si usas endpoints externos, añade su origen a `connect-src`.
- `scripts/build-feed.js` escribe de forma idempotente y atómica; CI evita solapes con `concurrency`.
- Preferir PRs generados por agentes; server publica tras merge (ver `docs/AGENT_PROTOCOL.md`).
- Validación estricta: enlaces deben resolver (HEAD+GET), fuentes en allowlist (`/data/sources.json`), alcance LATAM + IA.

Más en `SECURITY.md` y `docs/DATA_PIPELINE.md` (seguridad de concurrencia y contratos de datos).

## Documentación relacionada

- `docs/DATA_LAYOUT.md` — Contrato y distribución de archivos en `data/`.
- `docs/DATA_PIPELINE.md` — Flujo de consolidación, entradas vs. generados y CI.
- `docs/AGENT_PROTOCOL.md` — Protocolo de agentes (prompts, endpoints, ejemplos).
- `docs/N8N_WORKFLOW_GUIDELINES.md` — Naming/prod (incluye alias “IvanFile”).
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
