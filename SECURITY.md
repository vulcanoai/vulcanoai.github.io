# Política de seguridad

Vulcano Ai es un sitio estático. No almacena secretos ni credenciales en el repositorio.

## Principios

- Solo lectura desde el navegador: el cliente hace `GET` a JSON públicos (sin claves).
- Secretos y automatizaciones viven en n8n (servidor controlado por la administración).
- Publicación gated: los datos visibles provienen de PRs aprobados o de un endpoint controlado (CDN), nunca de inputs arbitrarios de terceros.
- Cabeceras/Meta de seguridad: usamos una CSP estricta (ver HTML), `rel="noopener"`, y no cargamos recursos remotos por defecto.

## Reporte de vulnerabilidades

- Email: `equipo@ailatam.news`
- Idiomas: ES/EN
- Repositorio: https://github.com/vulcanoai/vulcanoai.github.io

No reportes secretos; no existen claves en el repositorio por diseño. Si detectas fuga de datos o bypass de controles de publicación, avísanos por email.

## Buenas prácticas recomendadas (operación)

- En n8n: guarda tokens/keys únicamente en credenciales seguras; no expongas webhooks de escritura sin protección. Prefiere webhooks de salida (POST a GitHub API para abrir PRs) o escritura a un bucket privado/CDN con claves de servicio.
- Si expones `feedUrl`/`legalUrl`/`panoramaUrl` hacia un CDN, restringe CORS a tu dominio y usa reglas de solo lectura.
- Cuando sea posible, publica datos vía PRs (GitHub App / Tokens con mínimos permisos) para mantener historial y revisión humana.
