# Workflow `AUTORESEARCH`

Workflow n8n responsable de recolectar noticias globales de IA y convertirlas en cápsulas listas para la web. El archivo JSON se encuentra en `n8n/workflows/AUTORESEARCH.json`.

## Resumen

| Nodo | Tipo | Detalle |
|------|------|---------|
| `SCHEDULE` | Trigger | Corre cada hora (`interval: minutes = 60`). |
| `BUILD_RESEARCH_BRIEF` | Code | Genera el objeto `brief` con instrucciones editoriales y el formato de cápsulas. |
| `HTTP YouTube Search` | Tool | Consulta Piped (`/api/v1/search`) para buscar videos recientes de IA. Recibe `{query, region, lang}`. |
| `HTTP Web Extractor` | Tool | Obtiene contenido plano usando el proxy `https://r.jina.ai/https://{target}` para portales y papers de IA. |
| `STRUCTURED CAPSULE PARSER` | Output Parser | Enforce JSON Schema para `capsules[].{capsule_id, created_at, title, summary, tags[], sources[], body[]}`. |
| `AI Agent` | LangChain Agent | Orquesta búsquedas (EE. UU., Rusia, China), redacta resúmenes y retorna JSON válido. Tiene `maxIterations = 6`. |
| `PARSE_AGENT_OUTPUT` | Code | Normaliza el JSON, rellena valores faltantes y genera el bloque de texto estilo `Capsule-ID`. |
| `BUILD_AGENT_PUT` | Code | Construye payloads para GitHub (`data/capsules/ai-researcher/<timestamp>-<slug>.md`). |
| `PUSH_TO_GITHUB` | HTTP Request | PUT contra la API de GitHub usando credencial `githubApi`. |

## Flujo completo

1. **Brief editorial** — El nodo `BUILD_RESEARCH_BRIEF` fija ventana de 24 h, notas de estilo y formato esperado.
2. **Investigación autónoma** — El `AI Agent` recibe el brief, conecta con las herramientas y produce entre 2 y 4 cápsulas en JSON.
3. **Validación** — `STRUCTURED CAPSULE PARSER` obliga a respetar el esquema; si falta un campo, el agente reintenta.
4. **Normalización** — `PARSE_AGENT_OUTPUT` limpia texto, crea slugs y arma el bloque que usa la UI (`Capsule-ID`, `Tags`, `Body`, etc.).
5. **Publicación** — `BUILD_AGENT_PUT` genera el archivo `.md` con encabezado, contenido plano y anexa el JSON dentro de un bloque ```json```. El `PUSH_TO_GITHUB` lo sube al repo `vulcanoai/vulcanoai.github.io` (rama `main`).

## Integración con la web

- La demo incluye `data/capsules.json` como snapshot local. En producción se recomienda que el workflow exponga un archivo actual (por ejemplo `data/capsules/doc-latest.txt`) o un endpoint HTTP que la web pueda leer directamente.
- `capsule-main.js` buscará primero `doc-latest.txt`; si no existe o falla, consultará los snapshots de GitHub y, sólo si nada está disponible, usará `data/capsules.json` como respaldo.
- El formato de texto debe respetar los separadores `---` y los campos en español para que la UI pueda indexar títulos y fuentes.

## Personalización rápida

- **Más regiones:** duplica `HTTP YouTube Search` cambiando el parámetro `region`. El agente puede decidir qué herramienta usar según sus instrucciones.
- **Fuentes privadas:** sustituye `HTTP Web Extractor` por un Webhook interno o añade autenticación básica en el proxy.
- **Auto-fix:** si quieres que n8n reintente el parseo usando otro LLM, activa `autoFix` en el parser y conecta un modelo adicional.

## Requisitos

- Credenciales `openAiApi` y `githubApi` configuradas en n8n.
- Permisos de escritura sobre `data/capsules/ai-researcher/` en GitHub Pages.
- (Opcional) Entorno que permita llamadas a `https://piped.video` y `https://r.jina.ai`.

Mantener este workflow como verdad única: cualquier experimento nuevo debería clonarse a partir de `AUTORESEARCH` para evitar divergencias.
