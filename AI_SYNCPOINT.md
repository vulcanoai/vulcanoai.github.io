# Punto de sincronización (AI Syncpoint)

Referencia oficial de la demo estable (`main`). Úsala antes de proponer cambios. Versión vigente: **v1.1.0**.

- Rama: `main`
- Componentes vivos: `index.html`, `pages/vision.html`, workflow `AUTORESEARCH`.
- Todo lo demás fue eliminado o recreado.

## Qué implica esta versión
- UI minimalista con un único componente de chat (`chat-component.js`).
- Datos leídos desde `data/capsules/doc-latest.txt` (si existe), de los snapshots `.md` en GitHub o, en último caso, del snapshot local `data/capsules.json`.
- CSP estricta en ambas páginas (`default-src 'self'`).
- Sin navegación secundaria, sin feeds legacy, sin páginas adicionales.

## Validación rápida (≤30 s)
1. Servir el proyecto (`python3 -m http.server 8080`).
2. Abrir `http://localhost:8080/` → deben aparecer las cápsulas de ejemplo del snapshot local (2 entradas).
3. Abrir `http://localhost:8080/pages/vision.html` → debe mostrar los prompts predefinidos.
4. (Opcional) Importar `AUTORESEARCH.json` en n8n y ejecutar una corrida manual para confirmar que se genera un `.md` en `data/capsules/ai-researcher/`.

## Reglas para futuras iteraciones
- Si tocas el workflow, actualiza `docs/autoresearch.md` y `AI_AGENTS.md`.
- Si cambias el formato de cápsulas, ajusta `capsule-main.js` y documenta el nuevo contrato.
- No añadas nuevas páginas sin documentar su propósito en `docs/README.md`.
- Mantén la CSP estricta; cualquier llamada externa debe declararse explícitamente.

---
Este es el baseline a partir del cual se construirán futuras features.
