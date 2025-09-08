/*
  config.js — Punto único de configuración del cliente.
  - Los agentes (n8n, workers) deben publicar JSON accesibles por CORS.
  - Mantener rutas bajo `api` para intercambiar fácilmente endpoints.
  - Sugerencia: parametrizar por env (ej. window.__CFG__) si se usa en múltiples despliegues.
*/
window.AILatamConfig = window.AILatamConfig || {
  api: {
    // Por defecto mostramos el snapshot del día (si existe). Fallback: sample-feed.json
    feedUrl: '/data/feed-2025-09-08.json',
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
  },
  social: {
    instagram: 'https://instagram.com/vulcanoai.solutions',
    x: 'https://x.com/VulcanoAi',
    linkedin: 'https://www.linkedin.com/company/vulcano-ai/',
    whatsappNumber: '+573193620926',
    whatsappLink: 'https://wa.me/573193620926',
    whatsappDefaultText: 'Hola Vulcano Ai, quiero recibir noticias {frecuencia}.'
  },
  donate: {
    patreon: 'https://patreon.com/vulcanoai?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink',
    mercadopago: 'https://link.mercadopago.com.co/vulcanoai',
    nequiNumber: '+57 319 362 0926',
    discord: 'https://discord.gg/7AjU7kkH',
    twitch: 'https://www.twitch.tv/vulcanoai',
    brebKeys: [
      // Llaves Bre-b (ejemplos). Reemplazar por las verdaderas si aplica.
      { etiqueta: 'Bre-b Principal', llave: 'breb1qxy2kgdygjrsqtzq2n0...' },
      { etiqueta: 'Bre-b Respaldo', llave: 'breb1l9hk0t5jv7w3kz8m2a...' }
    ]
  }
};
