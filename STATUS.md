# Vulcano AI — Capsule Status (Live Ops)

Date: 2025‑09‑16  
Release: Capsule v3.0 (Conversational + Voz)

## 🚀 Product Readiness

| Área | Estado | Notas |
| --- | --- | --- |
| **Experiencia Conversacional** | ✅ Online | `index.html` / `pages/noticias.html` corren la cápsula minimalista con voz integrada. |
| **Audio & Voz** | 🟢 Estable | Dictado y lectura disponibles en Chrome/Edge. Safari y Firefox quedan en modo texto. |
| **Datos (feed-latest)** | 🟡 Vigilado | El feed está vacío. Requiere nuevas fuentes aprobadas en n8n para nutrir la cápsula. |
| **Documentación** | ✅ Actualizada | `README.md`, `docs/experience-manifest.md`, `docs/legacy-audit.md`. |
| **Componentes Legacy** | 🟡 En transición | Ver `docs/legacy-audit.md` para lista de archivos a archivar. |

## 📊 Métricas críticas

- `feed-latest.json`: 0 artículos (actualizar pipelines con urgencia).
- Latencia objetivo: < 30 min desde publicación a respuesta.
- Tiempo a primera interacción (TTFI): < 3 s en pruebas locales.
- % navegadores con voz activa: ~70% (Chromium). Safari/Firefox requieren fallback manual.

## 🔄 Pipeline de datos

1. **Ingesta (n8n)** — RSS y agentes proponen entradas en `data/runs/`.
2. **Validación** — Revisores humanos mantienen la allowlist (`data/sources.json`).
3. **Consolidación** — `scripts/build-feed.js` genera `data/feed-latest.json` y agregados.
4. **Consumo** — `capsule.js` solo lee `feed-latest.json`; sin fallback a snapshots.

### Próximos pasos de datos
- Reactivar workflows `MERGE_AND_CLEAN_GLOBAL_FEED_fixed.json` y `PRODUCTION_AI_RESEARCH_FEED_AUTOPILOT.json`.
- Configurar alertas cuando el feed quede vacío (>6 h sin publicaciones).
- Documentar un script de verificación de enlaces antes de cada release.

## 🔊 Voz y audio

- Dictado (`SpeechRecognition`) se inicia/termina desde `capsule-voice`; errores de permiso generan feedback textual.
- Reproducción (`SpeechSynthesis`) queda bajo control manual (`capsule-audio`).
- Próxima iteración: fallback en servidores (TTS vía n8n / AWS Polly) para entregar briefings en Alexa.

## 🧭 Roadmap inmediato

1. **Alimentar el feed** — Prioridad crítica. Sin artículos la experiencia pierde sentido.
2. **Archivar legacy** — Mover páginas y scripts antiguos a `legacy/` o branch separado.
3. **Checklist de voz** — Documento de compatibilidad por navegador + guía de permisos.
4. **Integración Alexa** — Diseñar skill que consuma resúmenes generados con el mismo pipeline.

## ✅ Hechos recientes

- Cápsula rediseñada con botones de voz/audio y chips orientados a briefing.
- Documentación alineada con el manifiesto 2025.
- Config de navegación limpia (sin menús legacy).
- Audit log creado para rastrear componentes heredados.

Mantener la cápsula ligera, humana y enfocada en LATAM.
