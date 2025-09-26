# Legacy Audit — Sept 2025

Este documento identifica archivos que pertenecen al paradigma anterior (sitio tipo dashboard) y define el plan para converger al modelo de cápsula conversacional.

## 1. Frontend

| Área | Estado | Acción recomendada |
| --- | --- | --- |
| `assets/js/app.js`, `panels.js`, `panels-content.js`, `theme.js`, `crypto-cultural.js`, `experimental.js`, `status-badge.js`, `logo.js` | No se cargan en la cápsula. Mantienen lógica de navegación, paneles y métricas. | Archivar en `legacy/` o eliminarlos tras migrar cualquier lógica útil a agentes n8n. |
| `assets/js/feed.js` | Motor completo de tarjetas y filtros. No se usa en la cápsula. | Rescatar utilidades que sigan siendo válidas (normalización, formatos) o mover a `scripts/`. El resto se puede retirar. |
| `assets/css/styles.css` | Contiene estilos de la era dashboard. La nueva cápsula ocupa ~200 líneas al final. | Dividir en `capsule.css` + `legacy.css`. Depurar variables que solo sirvan a componentes antiguos. |
| `assets/icons.svg` | Mantiene íconos de navegación/analytics que ya no se muestran. | Mantener solo los íconos empleados por la cápsula y legal/brand. |
| `index.html`, `pages/noticias.html` | Actualizados a la cápsula. | ✅ |
| `pages/*.html` (excl. `noticias.html`) | ✅ Redirigen a la cápsula. | Evaluar si se eliminan o se mueven a un branch `legacy-site`. |
| `pages/legal/*` | Políticas útiles. | Dejar como documentos estáticos, pero limpiar referencias a navegación antigua. |

## 2. Datos / Automatización

| Área | Estado | Acción |
| --- | --- | --- |
| `scripts/` y docs de pipeline | Vigentes. | Mantener — alimentan el feed consumido por la cápsula. |
| `data/index/*`, `data/stories/*` | Generados por CI. | Usar para futuras vistas en audio/briefings; no se exponen en UI actual. |
| `n8n/*` | Workflows privados; no cambia. | Documentar cómo entregar briefs de audio si se automatiza la voz. |

## 3. Documentación

| Archivo | Estado | Acción |
| --- | --- | --- |
| `docs/DATA_LAYOUT.md`, `docs/DATA_PIPELINE.md`, `docs/AGENT_PROTOCOL.md` | Vigentes. | Añadir nota de que la cápsula es el único front oficial. |
| Guías antiguas sobre layouts (`docs/UX`, etc.) | Referencian grids y dashboards. | Marcar como legacy o archivarlas. |

## 4. Diseño / Contenido Pendiente

1. **Centralizar tokens:** Crear `assets/css/capsule.css` con solo los estilos necesarios. Reducir dependencias al enorme stylesheet antiguo.
2. **Eliminar navegación duplicada:** `assets/js/config.js` aún enumera menús para los dashboards. Reducirlo a la cápsula o moverlo a una sección “legacyNav”.
3. **Audio manifiesto:** Documentar cómo producir briefings automatizados (Alexa, podcast, etc.) y cómo reutilizar `voiceState` fuera del navegador.
4. **Archivar páginas legacy:** Decidir si viven en un subdirectorio `legacy/` o en otro branch (`legacy-site`).
5. **Testing:** Agregar check manual/regresiones para reconocimiento y síntesis de voz (lista de navegadores compatibles).

## 5. Resultado

- El usuario final solo interactúa con la cápsula conversacional.
- Los componentes restantes se consideran “legado” y no deben reactivarse sin aprobación explícita.
- Cada PR que toque archivos legacy debe registrar la razón en esta bitácora hasta su eliminación definitiva.

> Una vez completados los pasos anteriores, el repositorio quedará completamente alineado con el manifiesto de experiencia 2025.
