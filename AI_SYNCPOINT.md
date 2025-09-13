# Punto de sincronización (AI Syncpoint)

Esta es la versión de referencia sobre la que vamos a continuar trabajando.
Sirve para que personas y modelos de IA se sincronicen con el estado actual
sin ambigüedad.

- Rama: `main`
- Commit base (UI original con animaciones): `9d63c8e`
- Este commit solo agrega este archivo de sincronización; el producto no cambia.

## Qué implica “esta versión”
- Animaciones y efectos activos (sin modo "minimal").
- Navegación, héroes y CTA tal como estaban en el diseño original.
- Datos cargados desde `/data/` (feed actual + snapshots diarios cuando existen).
- CSP restrictiva en páginas (connect-src 'self'). Para integrar n8n u otros
  endpoints, actualizar la meta CSP correspondiente.

## Páginas clave
- `pages/noticias.html`: feed + filtros + métricas.
- `pages/panorama.html`: resumen de categorías (contenido estático; data vive en `/data/panorama.json`).
- `pages/observatorio-legal.html`: línea temporal legal (data en `/data/legal-sample.json`).
- `pages/fuentes.html`: fuentes y metodología (estático + contadores básicos).
- `pages/agentes.html`: estado de agentes desde `/data/agents.json`.
- `pages/vulcano.html`: información de la compañía/proyecto.

## Configuración
- `assets/js/config.js` controla endpoints (`/data/*`) y navegación.
- Actualmente NO hay banderas de “modo minimal” activas.

## Validación rápida (30s)
1) Abrir `pages/noticias.html` y verificar animaciones en héroe.
2) Usar filtros y búsquedas (ej.: `?tema=Regulación`, `?pais=Colombia`).
3) Abrir `pages/panorama.html` y confirmar layout y estilos originales.

## Notas para agentes/modelos
- Respetar CSP en cada página. Si proponen llamadas externas, indicar el
  cambio de CSP necesario.
- Cualquier propuesta de UI debe preservar el foco en datos y la estética
  científica del diseño original.
- Cambios amplios deben documentarse en un archivo aparte y referenciar este
  syncpoint como baseline.

---
Esta es la versión canónica para continuar. Si se crea otra línea de trabajo,
referenciar explícitamente este punto: `9d63c8e`.
