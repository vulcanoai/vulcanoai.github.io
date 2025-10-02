# Vulcano AI — Stable Demo (v1.1.0)

Este repositorio contiene la demo estable de Vulcano AI (dos páginas públicas): la cápsula principal (`index.html`) que presenta las cápsulas de investigación y la página de visión (`pages/vision.html`). El objetivo es tener una base mínima, limpia y documentada para iterar con seguridad.

## Componentes

| Componente | Ruta | Descripción |
|------------|------|-------------|
| Cápsula principal | `index.html` | Conversa con el visitante y lee las cápsulas generadas por AUTORESEARCH. |
| Visión premium | `pages/vision.html` | Reutiliza la misma UI con guiones predefinidos para explicar la propuesta de valor. |
| Workflow n8n | `n8n/workflows/AUTORESEARCH.json` | Investiga YouTube y portales especializados (EE. UU., Rusia, China) y produce cápsulas estructuradas en español. |
| Snapshot demo | `data/capsules.json` | Snapshot estructurado listo para pruebas locales sin n8n. |
| JS compartido | `assets/js/chat-component.js` | Componente unificado de conversación; `capsule-main.js` y `capsule-vision.js` lo configuran según la página. |

Consulta `docs/README.md` para el mapa completo y `docs/autoresearch.md` para el detalle del workflow.

## Cómo ejecutar la demo

```bash
python3 -m http.server 8080
# o cualquier servidor estático equivalente
```

1. Abre `http://localhost:8080/` para la cápsula principal.
2. Visita `http://localhost:8080/pages/vision.html` para la página de visión.
3. Edita `data/capsules.json` si quieres probar tus propias cápsulas manualmente (respeta el esquema `{ "capsules": [] }`).

## Integración con AUTORESEARCH

- Configura las credenciales `openAiApi` y `githubApi` en n8n.
- Importa `n8n/workflows/AUTORESEARCH.json` y ajusta tu schedule (por defecto corre cada hora).
- El workflow publica archivos `.md` en `data/capsules/ai-researcher/` con contenido textual y el JSON embebido.
- La web intenta leer `doc-latest.txt`. Si no existe o retorna error, consulta la API de GitHub para descargar el snapshot más reciente (`doc-*.txt` o `<timestamp>*.md`). Solo si ambas rutas fallan usa `data/capsules.json` como respaldo local.
- Asegúrate de que al menos un snapshot con formato de cápsulas esté accesible públicamente para que la demo tenga contenido.

## Diseño y experiencia

- Minimalismo total: un solo contenedor, respuestas cortas y fuentes opcionales.
- Se prioriza español neutro, etiquetado temático y referencias claras.
- Toda la interacción pasa por `chat-component.js`, lo que facilita extender la experiencia a futuras páginas o dispositivos.

## Datos y agentes

- `data/agents.json` documenta el estado del agente autónomo.
- `AI_AGENTS.md` y `AI_COMMENTS.md` resumen decisiones y próximos pasos.
- `docs/autoresearch.md` es la referencia técnica para evolucionar el pipeline.

## Próximos pasos sugeridos

1. Añadir un paso en `AUTORESEARCH` para publicar también `doc-latest.txt` (o un endpoint equivalente) y así evitar la dependencia de la API de GitHub.
2. Registrar métricas ligeras del agente (fecha de última ejecución, cápsulas generadas) en un JSON dedicado si se requiere monitoreo público.
3. Preparar despliegues diferenciados (demo, staging, producción) ajustando `assets/js/config.js` mediante variables de entorno o un `window.__CFG__`.

---

Mantén este repositorio pequeño y claro: cualquier feature nueva debería comenzar actualizando los documentos y el workflow antes de tocar la UI.
