/*
  config.js — Punto único de configuración del cliente.
  - Los agentes (n8n, workers) deben publicar JSON accesibles por CORS.
  - Mantener rutas bajo `api` para intercambiar fácilmente endpoints.
  - Sugerencia: parametrizar por env (ej. window.__CFG__) si se usa en múltiples despliegues.
*/
window.AILatamConfig = window.AILatamConfig || {
  api: {
    feedUrl: '/data/sample-feed.json',
    agentsUrl: '/data/agents.json',
    sourcesUrl: '/data/sources.json',
    panoramaUrl: '/data/panorama.json',
    legalUrl: '/data/legal-sample.json',
    // Endpoint opcional n8n para recibir envíos independientes (POST JSON)
    indieSubmitUrl: '',
    // Agente de búsqueda personalizada (POST {prompt, country?, topics?} -> [{...article}])
    searchAgentUrl: '',
    // Disparador de actualización (POST {reason})
    updateTriggerUrl: '',
    // Reclamación de autoría (POST {hash, alias, email})
    claimAuthorUrl: ''
  },
  site: {
    name: 'Vulcano Ai',
    baseUrl: '/',
  }
};
