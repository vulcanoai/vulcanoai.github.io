/*
  config.js — Punto único de configuración del cliente.
  - Los agentes (n8n, workers) deben publicar JSON accesibles por CORS.
  - Mantener rutas bajo `api` para intercambiar fácilmente endpoints.
  - Sugerencia: parametrizar por env (ej. window.__CFG__) si se usa en múltiples despliegues.
*/
window.AILatamConfig = window.AILatamConfig || {
  api: {
    capsulesDocUrl: '/data/capsules/doc-latest.txt',
    capsulesGitHub: {
      owner: 'vulcanoai',
      repo: 'vulcanoai.github.io',
      directory: 'data/capsules'
    }
  },
  site: {
    name: 'Vulcano AI',
    baseUrl: '/',
    version: 'v1.1.0'
  },
  social: {
    instagram: 'https://instagram.com/vulcanoai.solutions',
    x: 'https://x.com/VulcanoAi',
    linkedin: 'https://www.linkedin.com/company/vulcano-ai/',
    whatsappNumber: '+573193620926',
    whatsappLink: 'https://wa.me/573193620926',
    whatsappDefaultText: 'Hola! Me interesa recibir información sobre el proyecto Vulcano AI. Gracias!'
  },
  donate: {
    patreon: 'https://patreon.com/vulcanoai?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink',
    mercadopago: 'https://link.mercadopago.com.co/vulcanoai',
    nequiNumber: '+57 319 362 0926',
    discord: 'https://discord.gg/7AjU7kkH',
    twitch: 'https://www.twitch.tv/vulcanoai'
  }
};
