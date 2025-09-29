# Vulcano AI — Stable Demo Status

Fecha: 2025‑09‑29  
Release: Demo estable v1 (Cápsula + Visión + AUTORESEARCH)

## ✅ Qué está en producción

| Área | Estado | Notas clave |
| --- | --- | --- |
| Cápsula principal (`index.html`) | 🟢 Operativa | Carga `data/capsules/doc-latest.txt` y, si no existe, busca el snapshot más reciente en GitHub (`doc-*.txt` o `<timestamp>*.md`). |
| Página Visión (`pages/vision.html`) | 🟢 Operativa | Usa el mismo componente de chat para guiar conversaciones comerciales. |
| Workflow AUTORESEARCH | 🟡 Manual | JSON listo e importable. Requiere credenciales `openAiApi` y `githubApi` para correr en n8n. |
| Documentación | 🟢 Actualizada | `README.md`, `docs/README.md`, `docs/autoresearch.md`. |
| Assets legacy | 🔴 Retirados | Se eliminaron páginas y scripts antiguos para reducir ruido. |

## 📊 Métricas / datos de referencia

- `data/capsules/doc-latest.txt` contiene 3 cápsulas de ejemplo (EE. UU., Rusia, China).
- `data/capsules/ai-researcher/` almacena snapshots `.md` generados por el workflow.
- `data/agents.json` registra al agente "Vulcano Researcher" como demo estable.

## 🚦 Próximos pasos mínimos

1. **Automatizar `doc-latest.txt`:** ajustar `BUILD_AGENT_PUT` para que el workflow también publique el archivo `doc-latest.txt` (incluyendo `sha` al actualizar).
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
