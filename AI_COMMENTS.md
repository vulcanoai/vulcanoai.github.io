# AI_COMMENTS.md — Notas actuales

## 🎯 En qué estamos
- Mantener la demo estable (cápsula + visión) funcionando con snapshots locales.
- Preparar el workflow `AUTORESEARCH` para producción:
  - Credentials `openAiApi` + `githubApi` en n8n.
  - Validar que las herramientas (`HTTP YouTube Search`, `HTTP Web Extractor`) respondan desde el entorno final.
  - Plan: añadir una segunda salida en `BUILD_AGENT_PUT` para publicar `data/capsules/doc-latest.txt` con `sha`.

## ✅ Hecho
- Eliminados HTML y JS legacy; sólo quedan los módulos requeridos (`config.js`, `chat-component.js`, `capsule-main.js`, `capsule-vision.js`).
- Soporte en `capsule-main.js` para snapshots `.md` generados por AUTORESEARCH.
- Documentación reescrita (`README.md`, `docs/README.md`, `docs/autoresearch.md`).
- Limpieza del repositorio (v1.1.0): se retiraron APIs, scripts y páginas fuera de alcance.

## 🔜 Tareas cortas
1. [ ] Ajustar `BUILD_AGENT_PUT` para publicar también `doc-latest.txt` (requiere buscar `sha`).
2. [ ] Añadir telemetría mínima al JSON del agente (`ultimo_ejecucion`, `throughput`).
3. [ ] Crear script rápido (Node/Python) para convertir archivos `.md` en `doc-latest.txt` si se quiere correr localmente sin n8n.

## 🧩 Decisiones técnicas
- El sitio ya no carga `feed-latest.json`; todo gira alrededor del documento de cápsulas.
- El schema obligatorio vive en el nodo `STRUCTURED CAPSULE PARSER`. Cualquier cambio se hace ahí y se refleja en `docs/autoresearch.md`.
- Los fetch a GitHub sólo usan la API pública (`Accept: application/vnd.github.v3+json`). Si se requiere autenticación, exponer un endpoint propio.

## ❓ Preguntas abiertas
- ¿Se necesita conservar las cápsulas históricas (`doc-*.txt`)? Actualmente sirven como fallback; si molestan, podrían moverse a un bucket separado.
- ¿Qué tan seguido debe correr AUTORESEARCH en producción? El schedule actual es cada 60 minutos.

Mantener este archivo breve y accionable; todo lo demás vive en `docs/`.
