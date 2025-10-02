# AI_AGENTS.md — Demo estable

Solo existe un agente operativo en esta versión: **Vulcano Researcher**. El objetivo es mantenerlo simple y trazable.

## 1. Identidad

- **Nombre:** Vulcano Researcher
- **Workflow:** `AUTORESEARCH` (n8n)
- **Rol:** Investigar noticias globales de IA (EE. UU., Rusia, China) y entregarlas en español neutro.
- **Output:** Cápsulas estructuradas (`capsule_id`, `created_at`, `title`, `summary`, `tags[]`, `sources[]`, `body[]`).

## 2. Flujo operativo

1. `SCHEDULE` ejecuta cada 60 min.
2. `BUILD_RESEARCH_BRIEF` define la ventana y las reglas editoriales.
3. `AI Agent` utiliza dos herramientas:
   - `HTTP YouTube Search` → API pública de Piped.
   - `HTTP Web Extractor` → Proxy `r.jina.ai` para portales especializados.
4. `STRUCTURED CAPSULE PARSER` obliga al JSON a cumplir el esquema.
5. `PARSE_AGENT_OUTPUT` normaliza y genera el texto legible por la web.
6. `BUILD_AGENT_PUT` + `PUSH_TO_GITHUB` publican el snapshot `.md` en `data/capsules/ai-researcher/`.

## 3. Contratos y expectativas

- **Idioma:** Español neutro, sin traducir nombres propios.
- **Recencia:** ≤ 48 h, preferiblemente ≤ 24 h.
- **Cobertura:** Mínimo una cápsula por cada región objetivo (EE. UU., Rusia, China) en cada corrida.
- **Formato:** Separadores `---` y campos en español para que la web los indexe.
- **Fuentes:** Siempre incluir título legible + URL.

## 4. Observabilidad

Si se requiere monitoreo público, crea un `data/agents.json` con los siguientes campos:

```json
[
  {
    "nombre": "Vulcano Researcher",
    "estado": "Demo estable",
    "ultimo_ejecucion": "",
    "throughput": "0 cápsulas",
    "notas": "Workflow AUTORESEARCH. Actualiza data/capsules/ai-researcher/*.md"
  }
]
```

Completa `ultimo_ejecucion` y `throughput` una vez que el workflow se ejecute en producción.

## 5. Roadmap de agentes

- **AutoFix opcional:** conectar un modelo secundario al parser para corregir JSON.
- **Segmentos LATAM:** extender el brief para crear cápsulas específicas por país (Colombia, México, Chile).
- **Alertas:** publicar un HEAD a Slack/Discord cuando no se encuentren noticias en dos corridas consecutivas.

Cualquier nuevo agente debe documentarse en este mismo archivo antes de desplegarse.
