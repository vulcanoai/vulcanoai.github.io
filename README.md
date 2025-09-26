# Vulcano AI — Conversational Capsule

Vulcano AI ahora es una cápsula conversacional minimalista que entrega contexto y señales sobre inteligencia artificial en América Latina. Todo sucede dentro de un solo espacio: sin paneles, sin navegación secundaria y con audio disponible desde el primer momento.

## Visión

- **Propósito:** compartir noticias y análisis de IA para LATAM con tono humano, sereno y accionable.
- **North Star:** si se siente como hablar con una guía sabia, estamos en el lugar correcto; si se siente como usar software, retrocedemos.
- **Principios:** radical minimalism, conversación primero, cero fricción, seriedad cálida, relevancia local, calma y confianza.

## Experiencia clave

- **Una interacción, un resultado.** Campo centrado, chips opcionales y respuesta inmediata.
- **Audio integrado.** Grabación de voz (Web Speech API) y lectura automática de la respuesta (Speech Synthesis) cuando el navegador lo permite.
- **Resumen → Localización → Claridad.** El agente comprime el feed, resalta el ángulo LATAM y explica por qué importa.
- **Fuentes transparentes.** Cada respuesta ofrece un acceso discreto a las referencias utilizadas.
- **Confianza explícita.** Si la data está desactualizada o vacía, el agente lo menciona y sugiere el siguiente paso.

## Arquitectura actual

```
[data/feed-latest.json]  →  [capsule.js]  →  [UI conversacional]
```

- **Datos:** repositorio `data/` con `feed-latest.json`, snapshots y agregaciones generadas por `scripts/build-feed.js`.
- **Frontend:** HTML + CSS puros (`index.html` / `pages/noticias.html`) más un único controlador (`assets/js/capsule.js`). La historia de marca se expande en `pages/vision.html`, una cápsula gemela orientada a la visión.
- **Voz:** captura y lectura con APIs nativas (`SpeechRecognition` / `SpeechSynthesis`). Las funciones se degradan si el navegador no las expone.
- **Legado:** el resto de HTML/CSS/JS del repositorio se conserva como referencia histórica. Ningún flujo productivo depende de esos archivos; se revisan en `docs/legacy-audit.md`.

## Estructura relevante del repositorio

```
assets/
  css/styles.css        # Tokens y estilo de la cápsula
  js/capsule.js         # Lógica de conversación, voz y resumen
  icons.svg             # Sprite de íconos (incluye micrófono y audio)
data/                   # Feed consolidado y snapshots históricos
pages/noticias.html     # Clon de index.html (cápsula activa)
docs/
  experience-manifest.md
  legacy-audit.md
scripts/                # Build y validaciones de datos (CI/n8n)
```

> Nota: los archivos en `pages/`, `assets/js/app.js`, `assets/css/styles.css` (secciones legacy) y documentación previa siguen en el repositorio para consulta, pero no forman parte de la experiencia actual. Se irán archivando o refactorizando conforme avancen las iteraciones.

## Ejecutar localmente

1. Instala dependencias del pipeline de datos solo si vas a regenerar el feed (Node 18+). Para ver la cápsula basta con un servidor estático.
2. Servidor rápido:
   ```bash
   python3 -m http.server 8080
   # o npx serve .
   ```
3. Abre `http://localhost:8080/` y prueba la conversación (usa Chrome o Edge si quieres dictado y audio).
4. Para refrescar datos manualmente:
   ```bash
   VULCANO_ALLOW_LOCAL_DATA_WRITE=1 node scripts/build-feed.js
   ```
   Ajustes disponibles en `scripts/build-feed.js` (`FEED_MAX_AGE_DAYS`, `VERIFY_LINKS`, etc.).

## Lineamientos de diseño/contenido

- Respuestas ≤ 6 líneas salvo que el usuario pida más detalle.
- Verbos sobre sustantivos; sin relleno ni jerga innecesaria.
- Contexto LATAM por defecto: país, impacto y por qué importa.
- Chips: máximo dos sugerencias, siempre pertinentes a la consulta anterior.
- Fuentes solo cuando el usuario las solicita (botón “Ver fuentes”).

## Voz y accesibilidad

- `capsule.js` activa dictado si existe `SpeechRecognition` (Chrome, Edge). Cuando no está disponible se deshabilita el botón de micrófono.
- La lectura en voz alta se gobierna con el botón de audio. Queda en modo manual para evitar reproducción no deseada.
- Todas las acciones relevantes tienen descripciones `aria-` y estados `aria-pressed`/`aria-disabled` consistentes.
- Para integraciones futuras (Alexa, n8n, etc.) se documentan los endpoints en `docs/experience-manifest.md`.

## Datos y pipeline

- **Entrada:** agentes n8n y fuentes validadas generan PRs sobre `data/runs/` y `data/entries/`.
- **Consolidación:** `scripts/build-feed.js` produce `data/feed-latest.json` e índices (`data/index/*.json`).
- **Consumo:** la cápsula solo lee `feed-latest.json`. El resto de agregaciones permanece disponible para agentes y automatizaciones.
- **Contratos:** revisa `docs/DATA_LAYOUT.md` y `docs/DATA_PIPELINE.md` para estructuras y garantías de frescura.

## Colaborar

1. Respeta el manifiesto (`docs/experience-manifest.md`). Cualquier cambio de UI/UX debe preservar minimalismo, calma y conversación centrada.
2. Añade pruebas manuales para voz/audio si tocas `capsule.js`.
3. Documenta todo ajuste relevante en `docs/legacy-audit.md` hasta que los componentes heredados se archiven por completo.
4. Mantén la CSP estricta definida en `index.html`.

## Soporte

- WhatsApp: <https://wa.me/573193620926>
- X/Twitter: <https://x.com/VulcanoAi>
- LinkedIn: <https://www.linkedin.com/company/vulcano-ai/>

Manteniendo la cápsula ligera, humana y regional.
