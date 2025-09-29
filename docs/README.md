# Vulcano AI — Stable Demo Overview

Este repositorio entrega la primera demo estable de Vulcano AI. El producto público se reduce a dos piezas:

1. **Cápsula principal (`index.html`)** — lee un documento de cápsulas generado por el workflow `AUTORESEARCH` y lo sirve en formato conversacional.
2. **Página de visión (`pages/vision.html`)** — reutiliza el mismo componente de chat para explicar el manifiesto premium.

Todo lo demás fue depurado o archivado. El objetivo es tener una base mínima, clara y documentada.

## Arquitectura rápida

```
AUTORESEARCH (n8n) ──▶ data/capsules/ai-researcher/*.md
                        │
                        └──▶ data/capsules/doc-latest.txt (snapshot demo)
                                ↓
                           assets/js/capsule-main.js
                                ↓
                      index.html · chat-component.js
```

- **Workflow:** `n8n/workflows/AUTORESEARCH.json` ejecuta la recolección autónoma de noticias globales de IA.
- **Persistencia:** cada corrida escribe un `.md` con los hallazgos estructurados y, en producción, debe exponer un `.txt` estilo "Capsule-ID". El repo incluye `data/capsules/doc-latest.txt` como snapshot de referencia.
- **Frontend:** ambas páginas comparten `chat-component.js`. La cápsula principal monta `capsule-main.js`; la visión usa `capsule-vision.js` con respuestas precargadas.
- **Configuración:** `assets/js/config.js` centraliza paths y enlaces. Hoy solo consume `doc-latest` y la lista de cápsulas publicada en GitHub.

## Archivos esenciales

| Ruta | Propósito |
|------|-----------|
| `index.html` | Cápsula conversacional pública. |
| `pages/vision.html` | Versión visión / premium. |
| `assets/js/config.js` | Endpoints y metadatos del sitio. |
| `assets/js/chat-component.js` | UI unificada de conversación. |
| `assets/js/capsule-main.js` | Lógica de lectura de cápsulas. |
| `assets/js/capsule-vision.js` | Respuestas estáticas para la página de visión. |
| `data/capsules/doc-latest.txt` | Snapshot de ejemplo para la demo. |
| `n8n/workflows/AUTORESEARCH.json` | Workflow autónomo de investigación. |

## Formato de cápsulas

Cada cápsula en `doc-latest.txt` se separa con `---` y utiliza campos en español:

```
Capsule-ID: 2025-09-29-xai-colossus-2
Created-At: 2025-09-29T21:06:05Z
Title: xAI presenta Colossus 2, el datacenter de un gigavatio
Summary: xAI inaugura un centro de datos gigante para acelerar entrenamiento de modelos globales.
Tags: infraestructura, estados unidos, xai
Sources:
  - SemiAnalysis | https://www.semianalysis.com/2025/09/16/xais-colossus-2-first-gigawatt-datacenter/
Body:
  - El equipo de Elon Musk despliega Colossus 2, un complejo de 1 GW dedicado a IA de gran escala.
  - El diseño utiliza entrenamiento por refuerzo con datos sintéticos para reducir costos energéticos.
  - La inversión abre la puerta a alianzas con proveedores LATAM para experimentar con modelos fundacionales.
---
```

`capsule-main.js` convierte cada bloque en respuestas conversacionales, conserva fuentes y expone chips con los títulos.

## Cómo correr la demo

```bash
python3 -m http.server 8080  # o cualquier servidor estático
# abrir http://localhost:8080/
```

Para refrescar el snapshot a mano, edita `data/capsules/doc-latest.txt` o publica un archivo compatible desde n8n. La UI detecta cambios automáticamente en cada recarga.

## Próximos pasos sugeridos

- Conectar el workflow `AUTORESEARCH` a GitHub con credenciales de producción para que cargue `doc-latest.txt` en cada corrida.
- Exponer un endpoint (Cloudflare Workers / Vercel) que sirva el último `.md` como `.txt` para no depender de la API de GitHub.
- Añadir tracking de ejecución en `data/agents.json` (ver sección de agentes).

