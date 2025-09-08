/*
  demo-data.js — Datos de ejemplo y snapshot inicial
  Provee un fallback embebido para todas las vistas cuando aún no hay n8n/CDN.
  Otra IA puede leer esta estructura para entender el esquema esperado.
*/
(function(){
  const feed = [
    { id:"vulcano-launch-2025-09-08", title:"Lanzamiento de Vulcano Ai — canal abierto de noticias de IA en LATAM", summary:"Publicamos la primera versión del sitio con curaduría automática + verificación humana, categorías por país/tema y suscripción por WhatsApp.", url:"/pages/vulcano.html", source:"Vulcano Ai", source_url:"https://vulcano.ai/", country:"Regional", topics:["Comunidad","Plataformas"], language:"es", published_at:"2025-09-08T12:00:00Z", relevance:10, author:"Equipo Vulcano", curator:"Lukas (Ai)" },
    { id:"latam-brief-2025-09-08", title:"Boletín LATAM (08 Sep 2025): titulares y avances en IA", summary:"Compilación con enlaces y referencias del día para inversión, regulación y adopción empresarial en la región. Este boletín es un contenedor inicial y se reemplaza por fuentes conforme el pipeline n8n publique datos.", url:"/pages/noticias.html#boletin-2025-09-08", source:"Vulcano Ai", source_url:"https://vulcano.ai/", country:"Regional", topics:["Boletín","Resumen"], language:"es", published_at:"2025-09-08T11:30:00Z", relevance:7, author:"Lukas (Ai)", curator:"Lukas (Ai)" },
    { id:"mx-startup-01", title:"Startup mexicana levanta ronda seed para IA generativa en retail", summary:"La compañía usará los fondos para expandirse en México y Colombia, enfocándose en herramientas de recomendación y pricing dinámico.", url:"https://ejemplo.mx/noticia/startup-ia-retail", source:"El Economista", source_url:"https://eleconomista.com.mx/", country:"México", topics:["Startups","Inversión"], language:"es", published_at:"2025-09-01T13:00:00Z", relevance:8, author:"Redacción", curator:"Lukas (Ai)" },
    { id:"co-reg-01", title:"Colombia publica borrador de guía ética para IA en sector público", summary:"El documento propone principios de transparencia, seguridad y evaluación de impacto para proyectos estatales.", url:"https://gobierno.co/ia/guia-etica", source:"Gobierno de Colombia", source_url:"https://www.gov.co/", country:"Colombia", topics:["Gobierno","Ética","Regulación"], language:"es", published_at:"2025-09-03T09:00:00Z", relevance:9, curator:"Lukas (Ai)" },
    { id:"ar-research-01", title:"Investigadores argentinos presentan modelo multilingüe para español rioplatense", summary:"El equipo libera pesos y dataset anotado para fomentar la investigación abierta en la región.", url:"https://universidad.ar/ia/modelo-rioplatense", source:"Universidad Nacional", source_url:"https://universidad.ar/", country:"Argentina", topics:["Investigación","Modelo de lenguaje"], language:"es", published_at:"2025-08-28T18:30:00Z", relevance:7, curator:"Lukas (Ai)" },
    { id:"br-enterprise-01", title:"Banco brasileño adopta copilotos de IA para atención al cliente", summary:"Se reportan mejoras en tiempos de respuesta y satisfacción, con salvaguardas de privacidad.", url:"https://portal.br/noticias/copilotos-banco", source:"Folha de S.Paulo", source_url:"https://www.folha.uol.com.br/", country:"Brasil", topics:["Empresas","Adopción"], language:"pt", published_at:"2025-09-02T14:10:00Z", relevance:6, curator:"Lukas (Ai)" },
    { id:"cl-policy-01", title:"Chile lanza programa de becas para talento en IA", summary:"Las becas cubrirán maestrías y cursos especializados, con foco en aplicaciones industriales.", url:"https://gob.cl/ia/becas", source:"Gobierno de Chile", source_url:"https://www.gob.cl/", country:"Chile", topics:["Educación","Política pública"], language:"es", published_at:"2025-09-04T11:00:00Z", relevance:5, curator:"Lukas (Ai)" },
    { id:"pe-startup-01", title:"Perú: nueva aceleradora lanza tesis en IA aplicada a minería", summary:"Buscan soluciones de seguridad y mantenimiento predictivo con visión computacional.", url:"https://gestion.pe/tecnologia/aceleradora-ia-mineria", source:"Gestión", source_url:"https://gestion.pe/", country:"Perú", topics:["Startups","Industria"], language:"es", published_at:"2025-08-30T16:20:00Z", relevance:6, curator:"Lukas (Ai)" },
    { id:"uy-ethics-01", title:"Uruguay organiza foro regional sobre IA responsable", summary:"Participan reguladores, academia y empresas para discutir estándares y cooperación.", url:"https://elpais.com.uy/tecnologia/foro-ia-responsable", source:"El País Uruguay", source_url:"https://www.elpais.com.uy/", country:"Uruguay", topics:["Ética","Regulación"], language:"es", published_at:"2025-08-27T10:00:00Z", relevance:4, curator:"Lukas (Ai)" },
    { id:"latam-invest-01", title:"Fondos regionales crean consorcio para invertir en IA", summary:"La iniciativa coordina due diligence técnico y apoyo en go‑to‑market para startups de la región.", url:"https://bloomberglinea.com/latam/ia-consorcio", source:"Bloomberg Línea", source_url:"https://www.bloomberlinea.com/", country:"Regional", topics:["Inversión","Startups"], language:"es", published_at:"2025-09-05T08:45:00Z", relevance:9, curator:"Lukas (Ai)" }
  ];

  const agents = [
    {nombre:"Rastreador RSS", estado:"Activo", ultimo_ejecucion:"2025-09-08T10:15:00Z", throughput:120, notas:"45 feeds monitoreados"},
    {nombre:"Scraper Prensa MX", estado:"Activo", ultimo_ejecucion:"2025-09-08T10:10:00Z", throughput:18, notas:"anti‑bot ok"},
    {nombre:"Clasificador Temas", estado:"Activo", ultimo_ejecucion:"2025-09-08T10:16:00Z", throughput:140, notas:"modelo v2.3"},
    {nombre:"Detector País", estado:"Activo", ultimo_ejecucion:"2025-09-08T10:16:10Z", throughput:140, notas:"NER + heurísticas"},
    {nombre:"Deduplicador", estado:"Activo", ultimo_ejecucion:"2025-09-08T10:16:30Z", throughput:140, notas:"similitud semántica"},
    {nombre:"Generador Resumen", estado:"Pausado", ultimo_ejecucion:"2025-09-08T09:50:00Z", throughput:0, notas:"ajuste de prompts"},
    {nombre:"Análisis de Sentimiento", estado:"Activo", ultimo_ejecucion:"2025-09-08T10:16:40Z", throughput:140, notas:"batch"},
    {nombre:"Publicador Twitter", estado:"Fallo", ultimo_ejecucion:"2025-09-08T08:10:00Z", throughput:0, notas:"token inválido"},
    {nombre:"Publicador LinkedIn", estado:"Activo", ultimo_ejecucion:"2025-09-08T10:17:00Z", throughput:12, notas:"buffer 12/h"}
  ];

  const sources = [
    {nombre:"El Economista", url:"https://www.eleconomista.com.mx/", pais:"México", tipo:"Prensa"},
    {nombre:"La República", url:"https://www.larepublica.co/", pais:"Colombia", tipo:"Prensa"},
    {nombre:"Bloomberg Línea", url:"https://www.bloomberglinea.com/", pais:"Regional", tipo:"Prensa"},
    {nombre:"Folha de S.Paulo", url:"https://www.folha.uol.com.br/", pais:"Brasil", tipo:"Prensa"},
    {nombre:"Gestión", url:"https://gestion.pe/", pais:"Perú", tipo:"Prensa"},
    {nombre:"El País Uruguay", url:"https://www.elpais.com.uy/", pais:"Uruguay", tipo:"Prensa"},
    {nombre:"Gobierno de Colombia", url:"https://www.gov.co/", pais:"Colombia", tipo:"Gobierno"},
    {nombre:"Gobierno de Chile", url:"https://www.gob.cl/", pais:"Chile", tipo:"Gobierno"},
    {nombre:"arXiv AI", url:"https://arxiv.org/list/cs.AI/recent", pais:"Global", tipo:"Académico"},
    {nombre:"LATAM Tech Blogroll", url:"https://ejemplo.latam/blogroll", pais:"Regional", tipo:"Blogs"},
    {nombre:"Comunidad Vulcano — Envíos independientes", url:"https://github.com/vulcanoai/vulcanoai.github.io", pais:"Regional", tipo:"Independiente"}
  ];

  const panorama = [
    { slug:"startups", titulo:"Startups", descripcion:"Rastrea compañías emergentes de IA en la región.", valor_para_usuarios:"Descubrir actores, ofertas y tendencias.", claves:["Clasificación por sector","Ranking por país","Fechas, equipo, productos","Ganchos de noticia"], fuentes:["Crunchbase/perfiles","Búsquedas en X","Auto‑clasificación diaria"] },
    { slug:"inversion", titulo:"Financiamiento e inversiones", descripcion:"Flujos de capital en IA.", valor_para_usuarios:"Mapear deals y jugadores.", claves:["Rondas y montos","Inversionistas","Tendencias","Impacto"], fuentes:["Crunchbase/PitchBook","Web search","n8n: filtros y alertas"] },
    { slug:"regulacion", titulo:"Políticas y regulación", descripcion:"Ética, datos y adopción estatal.", valor_para_usuarios:"Navegar marcos y riesgos.", claves:["Nuevas leyes","Comparativas","Ejecución","Consultas"], fuentes:["Sitios gubernamentales","X: política IA","Auto‑tag por urgencia"] }
  ];

  const legal = [
    { pais:"Brasil", titulo:"PL 2338/2023 — Marco de IA", estado:"Debate", fecha:"2025-08-20T00:00:00Z", url:"https://www25.senado.leg.br/web/actividad…", resumen:"Principios, riesgo y sanciones.", organismo:"Senado Federal", temas:["riesgo","transparencia"] },
    { pais:"Colombia", titulo:"Guía ética para IA en sector público (borrador)", estado:"Consulta", fecha:"2025-09-03T00:00:00Z", url:"https://www.gov.co/", resumen:"Pide comentarios públicos.", organismo:"Gobierno de Colombia", temas:["ética","sector público"] }
  ];

  window.VULCANO_DEMO = { feed, agents, sources, panorama, legal };
})();
