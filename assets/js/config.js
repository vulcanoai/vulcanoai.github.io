/*
  config.js — Punto único de configuración del cliente.
  - Los agentes (n8n, workers) deben publicar JSON accesibles por CORS.
  - Mantener rutas bajo `api` para intercambiar fácilmente endpoints.
  - Sugerencia: parametrizar por env (ej. window.__CFG__) si se usa en múltiples despliegues.
*/
window.AILatamConfig = window.AILatamConfig || {
  api: {
    // Por defecto intenta feed-latest.json (datos en tiempo real), fallback: snapshot del día, fallback: sample
    feedUrl: '/data/feed-latest.json',
    feedFallback: '/data/feed-2025-09-12.json',
    feedSample: '/data/sample-feed.json',
    agentsUrl: '/data/agents.json',
    sourcesUrl: '/data/sources.json',
    panoramaUrl: '/data/panorama.json',
    legalUrl: '/data/legal-sample.json',
    // Endpoint n8n para recibir envíos independientes (POST JSON)
    indieSubmitUrl: 'https://n8n.vulcano.ai/webhook/indie-submit',
    // Agente de búsqueda personalizada (POST {prompt, country?, topics?} -> [{...article}])
    searchAgentUrl: 'https://n8n.vulcano.ai/webhook/search-agent',
    // Disparador manual de actualización (POST {reason})
    updateTriggerUrl: 'https://n8n.vulcano.ai/webhook/trigger-update',
    // Reclamación de autoría (POST {hash, alias, email})
    claimAuthorUrl: 'https://n8n.vulcano.ai/webhook/claim-author'
  },
  site: {
    name: 'Vulcano Ai',
    baseUrl: '/',
    nav: [
      { label:'Inicio', href:'/pages/noticias.html', icon:'calendar' },
      { label:'Panorama', href:'/pages/panorama.html', icon:'tag' },
      { label:'Crypto', href:'/pages/crypto.html', icon:'globe' },
      { label:'Legal', href:'/pages/observatorio-legal.html', icon:'scale' },
      { label:'Agentes', href:'/pages/agentes.html', icon:'robot' },
      { label:'Fuentes', href:'/pages/fuentes.html', icon:'source' }
    ],
    extraNav: [
      { label:'Apoyar', href:'/pages/apoya.html' },
      { label:'Qué es Vulcano AI', href:'/pages/vulcano.html' }
    ]
  },
  social: {
    instagram: 'https://instagram.com/vulcanoai.solutions',
    x: 'https://x.com/VulcanoAi',
    linkedin: 'https://www.linkedin.com/company/vulcano-ai/',
    whatsappNumber: '+573193620926',
    whatsappLink: 'https://wa.me/573193620926',
    whatsappDefaultText: '🤖 Hola! Me gustaría suscribirme a las noticias de IA en LATAM {frecuencia}. Gracias!'
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
