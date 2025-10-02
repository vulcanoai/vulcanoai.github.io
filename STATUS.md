# Vulcano AI — Stable Demo Status

Fecha: 2025‑09‑29  
Release: Demo estable v1 (Cápsula + Visión + AUTORESEARCH)

## ✅ Qué está en producción

| Área | Estado | Notas clave |
| --- | --- | --- |
| Cápsula principal (`index.html`) | 🟢 Operativa | Intenta `doc-latest.txt`, luego descarga el snapshot más reciente vía GitHub y, como último recurso, usa `data/capsules.json`. |
| Página Visión (`pages/vision.html`) | 🟢 Operativa | Usa el mismo componente de chat para guiar conversaciones comerciales. |
| Workflow AUTORESEARCH | 🟡 Manual | JSON listo e importable. Requiere credenciales `openAiApi` y `githubApi` para correr en n8n. |
| Documentación | 🟢 Actualizada | `README.md`, `docs/README.md`, `docs/autoresearch.md`. |
| Assets legacy | 🔴 Retirados | Se eliminaron páginas y scripts antiguos para reducir ruido. |

## 📊 Métricas / datos de referencia

- `data/capsules.json` contiene 2 cápsulas de ejemplo para la demo local.
- `data/capsules/ai-researcher/` almacena snapshots `.md` generados por el workflow.
- `data/agents.json` registra al agente "Vulcano Researcher" como demo estable.

## 🚦 Próximos pasos mínimos

1. **Automatizar entrega directa:** añadir a `BUILD_AGENT_PUT` la generación de `doc-latest.txt` (o un endpoint equivalente) para evitar depender solo de la API de GitHub.
2. **Monitoreo básico:** añadir fecha de última corrida y cantidad de cápsulas en `data/agents.json` para mostrarlo en la UI.
3. **Hardening del parser:** evaluar activar `autoFix` si el agente genera JSON incompleto.

## 🛠 Cómo probar rápidamente

```bash
python3 -m http.server 8080
# abrir http://localhost:8080/ para la cápsula
# abrir http://localhost:8080/pages/vision.html para la visión
```

Para validar el workflow:
1. Importa `n8n/workflows/AUTORESEARCH.json`.
2. Configura credenciales y lanza una ejecución manual.
3. Verifica que se cree un `.md` en `data/capsules/ai-researcher/` y que la web pueda leerlo (recarga la página para forzar fetch).

## Historial reciente

- 2025‑09‑29: Se eliminan páginas legacy, se documenta la demo y se agrega snapshot actualizado.
- 2025‑09‑29: `capsule-main.js` soporta archivos `.md` generados por AUTORESEARCH.
- 2025‑09‑29: Documentación y AI nodes actualizados para reflejar la nueva arquitectura.

La meta es mantener este estado como baseline estable; cualquier nueva iteración debe empezar actualizando esta bitácora.
