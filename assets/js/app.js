/*
  app.js — Inicializador por página
  - Detecta componentes por ID y carga módulos ligeros.
  - Mantener puro y defensivo: no asume presencia de elementos.
  - Agentes: añadir inicializaciones nuevas aquí con comprobación de existencia.
*/
document.addEventListener('DOMContentLoaded', () => {
  // Build header nav and mobile bottom nav from config
  buildUnifiedNav();
  enhanceFooter();
  
  // Initialize global header features
  initGlobalTimeZones();
  initEnhancedNavigation();

  // Initialize feed if present
  if (window.AILatamFeed && typeof window.AILatamFeed.initFeed === 'function'){
    window.AILatamFeed.initFeed();
  }
  // Regulatory highlights block (home)
  if (window.AILatamFeed && typeof window.AILatamFeed.initRegHighlights === 'function'){
     window.AILatamFeed.initRegHighlights();
  }
  
  // Initialize homepage hero stats
  initHeroStats();
  
  // Initialize crypto page if present
  initCryptoPage();
  
  // Initialize legal observatory if present
  initLegalObservatory();

  // Initialize sources page if present
  initSourcesPage();
  const sourcesList = document.getElementById('sources-list');
  if (sourcesList){ initSources(sourcesList).catch(console.error); }

  // Initialize archive page if present
  const archiveList = document.getElementById('archive-list');
  if (archiveList){ initArchivePage(archiveList).catch(console.error); }
  
  // Initialize support page if present
  initSupportPage();
  
  // Initialize company page if present
  initCompanyPage();
  
  // Initialize footer updates
  initFooterUpdates();

  // Initialize agents page if present
  const agentsGrid = document.getElementById('agents-grid');
  if (agentsGrid){ initAgents(agentsGrid).catch(console.error); }

  // Panorama (categorías) if present
  const pano = document.getElementById('panorama-grid');
  if (pano){ initPanorama(pano).catch(console.error); }
  // Legal observatory if present
  const legal = document.getElementById('legal-timeline');
  if (legal){ initLegal(legal).catch(console.error); }

  // Indie submission form if present
  const indie = document.getElementById('indie-form');
  if (indie){ initIndieForm(indie).catch(console.error); }

  // Live search + trigger update (home)
  const ls = document.getElementById('live-search-form');
  if (ls){ initLiveSearch(ls).catch(console.error); }
  const tu = document.getElementById('trigger-update');
  if (tu){ initTriggerUpdate(tu).catch(console.error); }

  // Smart marquee (hero)
  const sm = document.getElementById('smart-marquee');
  if (sm){ initSmartMarquee(sm).catch(console.error); }

  // World clock + last update, subtle footer row
  mountWorldClock().catch(console.error);

  // Noticias: compact "new since last visit" badge in header nav
  mountNavNewBadge().catch(console.error);

  // Legacy mobile navigation - now handled by initEnhancedNavigation()
  // This section is maintained for compatibility but functionality moved to initEnhancedNavigation()
  try{
    const btn = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.site-nav');
    if (btn && nav){
      // Create backdrop if it doesn't exist
      let backdrop = document.querySelector('.nav-backdrop');
      if (!backdrop){
        backdrop = document.createElement('div');
        backdrop.className = 'nav-backdrop';
        document.body.appendChild(backdrop);
      }
      
      // Add backdrop click handler
      backdrop.addEventListener('click', () => {
        nav.classList.remove('open');
        backdrop.classList.remove('show');
        document.body.classList.remove('nav-open');
        btn.setAttribute('aria-expanded', 'false');
      });
      
      // Add touch support for backdrop
      backdrop.addEventListener('touchstart', () => {
        nav.classList.remove('open');
        backdrop.classList.remove('show');
        document.body.classList.remove('nav-open');
        btn.setAttribute('aria-expanded', 'false');
      }, { passive: true });
      
      // Accessibility attributes
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', 'site-navigation');
      nav.setAttribute('id', 'site-navigation');
    }
  }catch(_){ /* noop */ }

  // SVG <use> polyfill for xlink:href (logo/icons visibility)
  try{
    document.querySelectorAll('use[href]').forEach(u=>{
      const v = u.getAttribute('href');
      if (v) u.setAttributeNS('http://www.w3.org/1999/xlink','href', v);
    });
  }catch(_){ /* noop */ }

  // (drag demo removed — keeping UI estática)

  // (removed) contemplative mode toggle

  // Active state handled inside buildUnifiedNav

  // WhatsApp form link
  const waForm = document.getElementById('wa-form');
  if (waForm){ initWhatsApp(waForm); }
  // simple link mode (no form)
  const waLinkOnly = document.getElementById('wa-link');
  if (!waForm && waLinkOnly){ initWhatsAppSimple(waLinkOnly); }
  // WhatsApp modal auto-prompt
  initWhatsAppModal();

  // Crypto studio (demo orbs)
  const cog = document.getElementById('crypto-orb-grid');
  if (cog && window.VulcanoLogo){
    const cfgs = [
      { radius: 42, lons: 10, rotations:[0,30,60] },
      { radius: 42, lons: 12, rotations:[15,45,75] },
      { radius: 42, lons: 14, rotations:[0,20,40] },
      { radius: 42, lons: 16, rotations:[10,50,70] }
    ];
    cfgs.forEach((opt, i)=>{
      const cell = document.createElement('div'); cell.className='orb orb-mini'; cog.appendChild(cell);
      window.VulcanoLogo.drawWireSphere(cell, opt);
    });
  }
});

function buildUnifiedNav(){
  const cfg = window.AILatamConfig || {};
  const items = (cfg.site && cfg.site.nav) || [
    { label:'Noticias', href:'/pages/noticias.html', icon:'calendar' },
    { label:'Panorama', href:'/pages/panorama.html', icon:'tag' },
    { label:'Legal', href:'/pages/observatorio-legal.html', icon:'scale' },
    { label:'Agentes', href:'/pages/agentes.html', icon:'robot' },
    { label:'Fuentes', href:'/pages/fuentes.html', icon:'source' },
  ];
  const here = location.pathname.replace(/index\.html$/, '/');

  // Header nav sync
  const headerNav = document.querySelector('.site-nav');
  if (headerNav){
    headerNav.innerHTML = '';
    for (const it of items){
      const a = document.createElement('a'); a.href = it.href; a.textContent = it.label;
      if (here.endsWith(it.href) || here===it.href){ a.setAttribute('aria-current','page'); }
      headerNav.appendChild(a);
    }
    // Add extra static links if present in config
    if (cfg.site && cfg.site.extraNav){
      for (const it of cfg.site.extraNav){ const a = document.createElement('a'); a.href=it.href; a.textContent=it.label; headerNav.appendChild(a); }
    }
  }

  // Footer nav sync (optional)
  const footerNav = document.querySelector('.footer-nav');
  if (footerNav && footerNav.children.length<3){ // preserve legal links
    for (const it of items.slice(0,3)){
      const a = document.createElement('a'); a.href=it.href; a.textContent=it.label; footerNav.appendChild(a);
    }
  }

  // Mobile bottom nav
  let mobile = document.querySelector('.mobile-nav');
  if (!mobile){ mobile = document.createElement('nav'); mobile.className='mobile-nav'; mobile.innerHTML = '<div class="inner"></div>'; document.body.appendChild(mobile); }
  const inner = mobile.querySelector('.inner'); inner.innerHTML='';
  for (const it of items){
    const a = document.createElement('a'); a.href = it.href;
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','icon'); svg.setAttribute('aria-hidden','true');
    const use = document.createElementNS('http://www.w3.org/2000/svg','use'); use.setAttributeNS('http://www.w3.org/1999/xlink','href','/assets/icons.svg#'+(it.icon||'tag'));
    svg.appendChild(use);
    a.append(svg, document.createTextNode(it.label));
    if (here.endsWith(it.href) || here===it.href){ a.classList.add('active'); }
    inner.appendChild(a);
  }
}

function enhanceFooter(){
  const cfg = window.AILatamConfig || {};
  const soc = (cfg.social||{});
  const footer = document.querySelector('.footer-inner');
  if (!footer) return;
  // Ensure Apoyar link in footer-nav
  const nav = footer.querySelector('.footer-nav');
  if (nav && !Array.from(nav.querySelectorAll('a')).some(a=>/\/pages\/apoya\.html$/.test(a.getAttribute('href')||''))){
    const a = document.createElement('a'); a.href='/pages/apoya.html'; a.textContent='Apoyar'; nav.appendChild(a);
  }
  // Social row
  if (!footer.querySelector('.social-row')){
    const row = document.createElement('div'); row.className='social-row';
    const add = (href, label, icon) => {
      if(!href) return; const a=document.createElement('a'); a.href=href; a.target='_blank'; a.rel='noopener'; a.setAttribute('aria-label', label);
      const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('class','icon'); s.setAttribute('aria-hidden','true');
      const u=document.createElementNS('http://www.w3.org/2000/svg','use'); u.setAttributeNS('http://www.w3.org/1999/xlink','href','/assets/icons.svg#'+icon); s.appendChild(u);
      a.append(s, document.createTextNode(' '+label)); row.appendChild(a);
    };
    add(soc.instagram, 'Instagram', 'instagram');
    add(soc.x, 'X', 'x');
    add(soc.linkedin, 'LinkedIn', 'linkedin');
    // Apoyar quick link
    const ap = document.createElement('a'); ap.href='/pages/apoya.html'; ap.textContent='Apoyar'; ap.className='btn'; row.appendChild(ap);
    footer.appendChild(row);
  }
}

// Smart marquee: scrolling glossy chips from existing categories
async function initSmartMarquee(container){
  try{
    const cfg = window.AILatamConfig?.api || {};
    const url = cfg.feedUrl || '/data/feed-latest.json';
    const items = await (await fetch(url, { cache:'no-store' })).json();
    const norm = (a) => ({
      country: a.country || a.pais || 'Regional',
      topics: a.topics || a.temas || []
    });
    const rows = Array.isArray(items) ? items : (items.items || items.articles || []);
    const data = rows.map(norm);
    const topics = Array.from(new Set(data.flatMap(x=>x.topics||[]))).filter(Boolean).sort();
    const countries = Array.from(new Set(data.map(x=>x.country||'').filter(Boolean))).sort();
    const tags = [];
    const take = (arr, n) => arr.slice(0, Math.min(arr.length, n));
    const tSel = take(topics, 12);
    const cSel = take(countries, 8);
    // Interleave for variety
    const max = Math.max(tSel.length, cSel.length);
    for (let i=0;i<max;i++){
      if (i < tSel.length) tags.push({ kind:'topic', value:tSel[i] });
      if (i < cSel.length) tags.push({ kind:'country', value:cSel[i] });
    }
    // Build track
    const track = container.querySelector('.track');
    if(!track) return;
    const buildChip = (tag) => {
      const a = document.createElement('a');
      const isCrypto = /^crypto$/i.test(tag.value) || /^cripto$/i.test(tag.value);
      a.className = 'chip glassy ' + (isCrypto ? 'crypto' : 'brand');
      a.href = tag.kind==='topic' ? (`/pages/noticias.html?tema=${encodeURIComponent(tag.value)}`) : (`/pages/noticias.html?pais=${encodeURIComponent(tag.value)}`);
      a.textContent = tag.value;
      return a;
    };
    const slugify = (str) => (str||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    const frag = document.createDocumentFragment();
    for (const t of tags){ frag.appendChild(buildChip(t)); }
    // Duplicate for seamless loop
    const frag2 = document.createDocumentFragment();
    for (const t of tags){ frag2.appendChild(buildChip(t)); }
    track.innerHTML='';
    track.append(frag, frag2);
    // Tune speed based on amount
    const dur = Math.max(24, Math.min(60, tags.length * 2));
    track.style.setProperty('--marquee-duration', dur + 's');
  }catch(e){ /* non-blocking */ }
}

async function initSources(container){
  // Load configured sources
  let sources;
  try{
    const url = (window.AILatamConfig?.api?.sourcesUrl) || '/data/sources.json';
    const res = await fetch(url, { cache:'no-store' });
    sources = await res.json();
  } catch(e){
    sources = window.VULCANO_DEMO?.sources || [];
  }
  // Load current feed to compute coverage metrics per source
  let feed = [];
  try{
    const fUrl = (window.AILatamConfig?.api?.feedUrl) || '/data/feed-latest.json';
    const raw = await (await fetch(fUrl, { cache:'no-store' })).json();
    feed = Array.isArray(raw) ? raw : (raw.articles || raw.items || []);
  }catch(_){ feed = []; }

  const trim = (s) => (s||'').toString().trim();
  const counts = new Map();
  const countries = new Map();
  for (const a of feed){
    const src = trim(a.source);
    if (!src) continue;
    counts.set(src, (counts.get(src)||0) + 1);
    const c = trim(a.country);
    if (c){ const set = countries.get(src) || new Set(); set.add(c); countries.set(src, set); }
  }

  // Index configured sources by name for easy lookup
  const idx = new Map(sources.map(s => [trim(s.nombre), s]));
  // Detect sources present in the feed but not in sources.json
  const unknown = [];
  for (const [src, n] of counts.entries()){
    if (!idx.has(src)){
      unknown.push({ nombre: src, url: '#', pais: Array.from(countries.get(src)||[]).join(', ')||'—', tipo: 'Detectadas', count: n });
    }
  }

  const all = sources.map(s => ({...s, count: counts.get(trim(s.nombre))||0, cover: Array.from(countries.get(trim(s.nombre))||[]) }));
  const byType = new Map();
  for (const src of all){
    const t = src.tipo || 'Otro';
    if(!byType.has(t)) byType.set(t, []);
    byType.get(t).push(src);
  }
  if (unknown.length) byType.set('Detectadas en el feed', unknown.sort((a,b)=> (b.count||0)-(a.count||0)));

  container.innerHTML = '';
  for (const [tipo, arr] of byType){
    const section = document.createElement('section');
    section.className = 'panel';
    const h = document.createElement('h3'); h.textContent = tipo.toUpperCase(); section.appendChild(h);
    const ul = document.createElement('ul');
    for (const s of arr){
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href = s.url || '#'; if (s.url && s.url.startsWith('http')){ a.target = '_blank'; a.rel = 'noopener'; } a.textContent = s.nombre;
      const meta = document.createElement('span'); meta.className = 'muted'; meta.textContent = ` (${s.pais || 'Regional'})`;
      li.appendChild(a); li.appendChild(meta);
      // Add count chip if present
      if (s.count){ const chip=document.createElement('span'); chip.className='chip'; chip.textContent = `${s.count} notas`; chip.style.marginLeft='8px'; li.appendChild(chip); }
      // Add coverage countries if available
      if (s.cover && s.cover.length){ const cover=document.createElement('span'); cover.className='chip'; cover.textContent = s.cover.slice(0,4).join(' · '); cover.style.marginLeft='6px'; li.appendChild(cover); }
      ul.appendChild(li);
    }
    section.appendChild(ul);
    container.appendChild(section);
  }
}

// Helper function for curator CSS classes
function getCuratorClassName(curator) {
  if (!curator) return 'luciano';
  const name = curator.toLowerCase();
  if (name.includes('luciano')) return 'luciano';
  if (name.includes('esperanza')) return 'esperanza';
  if (name.includes('sofía') || name.includes('sofia')) return 'sofia';
  if (name.includes('mateo')) return 'mateo';
  if (name.includes('amalia')) return 'amalia';
  if (name.includes('sebastián') || name.includes('sebastian')) return 'sebastian';
  if (name.includes('valentina')) return 'valentina';
  if (name.includes('alejandro')) return 'alejandro';
  if (name.includes('camila')) return 'camila';
  if (name.includes('rodrigo')) return 'rodrigo';
  if (name.includes('isabella')) return 'isabella';
  return 'luciano';
}

// World clock + last update ribbon (site-wide)
async function mountWorldClock(){
  try{
    const footer = document.querySelector('.footer-inner');
    if (!footer) return;
    // Remove existing row
    const existing = document.getElementById('world-clock');
    if (existing) existing.remove();
    const row = document.createElement('div'); row.id = 'world-clock'; row.className = 'clock-row';
    const zones = [
      { id:'UTC', tz:'UTC' },
      { id:'MX', tz:'America/Mexico_City' },
      { id:'BOG', tz:'America/Bogota' },
      { id:'BA', tz:'America/Argentina/Buenos_Aires' },
      { id:'SP', tz:'America/Sao_Paulo' },
    ];
    const fmt = (tz) => new Intl.DateTimeFormat('es-ES',{ hour:'2-digit', minute:'2-digit', timeZone:tz, hour12:false }).format(new Date());
    const frag = document.createDocumentFragment();
    for (const z of zones){
      const span = document.createElement('span'); span.className='time'; span.setAttribute('data-tz', z.tz);
      span.textContent = `${z.id} ${fmt(z.tz)}`; frag.appendChild(span);
    }
    const sep = document.createElement('span'); sep.className='sep'; sep.textContent = '•'; frag.appendChild(sep);
    const last = document.createElement('span'); last.className='time'; last.id='last-update'; last.textContent='Actualización: —'; frag.appendChild(last);
    row.appendChild(frag);
    footer.appendChild(row);
    // Update clocks every minute
    setInterval(() => {
      row.querySelectorAll('[data-tz]').forEach(el => { const tz=el.getAttribute('data-tz'); el.textContent = `${tz.split('/').pop().slice(0,2).toUpperCase()} ${fmt(tz)}`; });
    }, 60000);
    // Load status.json for last update
    try{
      const r = await fetch('/data/index/status.json', { cache:'no-store' });
      if (r.ok){ const s = await r.json(); const t = s.last_feed_update || s.last_run_iso || s.generated_at; if (t){ const d=new Date(t); const rel = timeAgo(d); last.textContent = `Actualización: ${rel}`; last.title = d.toLocaleString('es-ES'); } }
    }catch(_){ /* optional */ }
  }catch(_){ /* noop */ }
}

function timeAgo(date){
  const diff = Math.floor((Date.now() - date.getTime())/1000);
  if (diff < 60) return 'hace segundos';
  if (diff < 3600) return `hace ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff/3600)} h`;
  const days = Math.floor(diff/86400); return `hace ${days} d`;
}

// Compact badge in header nav for Noticias page
async function mountNavNewBadge(){
  try{
    const isNoticias = /\/pages\/noticias\.html$/.test(location.pathname);
    if (!isNoticias) return; // only on Noticias
    const last = Number(localStorage.getItem('lastVisit')||0);
    if (!last) return; // first visit, no badge yet
    const feedUrl = (window.AILatamConfig?.api?.feedUrl) || '/data/feed-latest.json';
    const raw = await (await fetch(feedUrl, { cache:'no-store' })).json();
    const arr = Array.isArray(raw) ? raw : (raw.articles || raw.items || []);
    const count = arr.filter(a => { const t = new Date(a.published_at||a.fecha||null).getTime(); return isFinite(t) && t > last; }).length;
    if (!count) return;
    const nav = document.querySelector('.site-nav'); if (!nav) return;
    const link = Array.from(nav.querySelectorAll('a')).find(a => /\/pages\/noticias\.html$/.test(a.getAttribute('href')||''));
    if (!link) return;
    // remove existing
    const ex = link.querySelector('.nav-badge'); if (ex) ex.remove();
    const b = document.createElement('span'); b.className='nav-badge'; b.textContent = `+${count}`; b.title = 'Nuevos desde tu última visita';
    link.appendChild(b);
  }catch(_){ /* noop */ }
}

async function initAgents(container){
  // Show loading state
  showAgentsLoadingState();
  
  async function loadAgents(){
    try{
      const url = (window.AILatamConfig?.api?.agentsUrl) || '/data/agents.json';
      const res = await fetch(url, { cache:'no-store' });
      return await res.json();
    }catch(e){ return window.VULCANO_DEMO?.agents || []; }
  }
  
  async function loadStatus(){
    try{
      const res = await fetch('/data/index/status.json', { cache:'no-store' });
      if (!res.ok) return null; return await res.json();
    }catch(_){ return null; }
  }
  
  try {
    const [agents, status] = await Promise.all([loadAgents(), loadStatus()]);

    // Update status summary
    const summaryEl = document.getElementById('agents-summary');
    if (summaryEl) {
      summaryEl.textContent = 'Cargando métricas del ecosistema...';
    }

    // Render agents grid
    const agentsGrid = document.getElementById('agents-grid');
    if (agentsGrid) {
      agentsGrid.innerHTML = '';
      
      for (const agent of agents) {
        const card = createAgentCard(agent);
        agentsGrid.appendChild(card);
      }
    }

    // Render metrics and status
    await renderAgentMetrics(status);
    // Render pipeline (runs + consolidation)
    await renderPipeline(status);
    
    // Update controls
    setupAgentControls(container);
    
    // Auto-refresh setup
    clearInterval(window.__agentsRefresh);
    if (window.__agentsAuto !== false){
      window.__agentsRefresh = setInterval(() => { initAgents(container).catch(console.error); }, 60000);
    }
    
  } catch (error) {
    console.error('Error loading agents:', error);
    showAgentsErrorState(error.message);
  }
}

// Archive (historical) page
async function initArchivePage(container){
  try{
    // Loading state
    container.innerHTML = '<div class="panel" style="text-align:center; padding:24px">Cargando archivo…</div>';

    // Load catalog (days)
    const [catRes, stRes] = await Promise.all([
      fetch('/data/index/catalog.json', { cache:'no-store' }),
      fetch('/data/index/status.json', { cache:'no-store' })
    ]);
    const catalog = catRes.ok ? await catRes.json() : { days: [] };
    const status = stRes.ok ? await stRes.json() : null;
    const days = Array.isArray(catalog.days) ? [...catalog.days].sort((a,b)=> b.localeCompare(a)) : [];

    // Short-circuit if empty
    if (!days.length){ container.innerHTML = '<div class="panel">No hay días en el archivo.</div>'; return; }

    // Fetch per-day indices and build facets
    const subset = days; // no historical cap
    const dayData = [];
    const allTopics = new Set();
    const allCountries = new Set();
    for (const d of subset){
      try{
        const idxRes = await fetch(`/data/entries/${d}/index.json`, { cache:'no-store' });
        const idx = idxRes.ok ? await idxRes.json() : { count: 0, topics:{}, countries:{} };
        Object.keys(idx.topics||{}).forEach(t=> allTopics.add(t));
        Object.keys(idx.countries||{}).forEach(c=> allCountries.add(c));
        dayData.push({ day: d, index: idx });
      }catch(_){ dayData.push({ day: d, index: { count: 0, topics:{}, countries:{} } }); }
    }

    // Populate hero stats
    const daysEl = document.getElementById('archive-days'); if (daysEl) daysEl.textContent = String(days.length);
    const latestEl = document.getElementById('archive-latest'); 
    if (latestEl){
      const t = status?.last_feed_update || status?.last_run_iso;
      latestEl.textContent = t ? timeAgo(new Date(t)) : '--';
    }

    // Populate filters
    const selCountry = document.getElementById('archive-filter-country');
    const selTopic = document.getElementById('archive-filter-topic');
    if (selCountry){ selCountry.innerHTML = '<option value="todos">Todos los países</option>' + Array.from(allCountries).sort().map(c=>`<option>${c}</option>`).join(''); }
    if (selTopic){ selTopic.innerHTML = '<option value="todos">Todos los temas</option>' + Array.from(allTopics).sort().map(t=>`<option>${t}</option>`).join(''); }

    const render = () => {
      const fc = selCountry ? selCountry.value : 'todos';
      const ft = selTopic ? selTopic.value : 'todos';
      container.innerHTML = '';
      let shown = 0;
      for (const { day, index } of dayData){
        const matchCountry = fc==='todos' || (index.countries||{})[fc] > 0;
        const matchTopic = ft==='todos' || (index.topics||{})[ft] > 0;
        if (!matchCountry || !matchTopic) continue;
        const card = document.createElement('article'); card.className='panel';
        const d = new Date(day);
        const title = d.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
        const count = index.count || 0;
        const head = document.createElement('div'); head.className='panel-head'; head.innerHTML = `<h3>${title}</h3><span class="muted">${count} artículos</span>`;
        const meta = document.createElement('div'); meta.className='meta';
        // Quick links
        const linkNoticias = document.createElement('a'); linkNoticias.className='chip brand'; linkNoticias.href=`/pages/noticias.html?dia=${day}`; linkNoticias.textContent='Ver noticias del día';
        const linkSnap = document.createElement('a'); linkSnap.className='chip'; linkSnap.href=`/data/feed-${day}.json`; linkSnap.target='_blank'; linkSnap.rel='noopener'; linkSnap.textContent='Snapshot JSON';
        const linkIndex = document.createElement('a'); linkIndex.className='chip'; linkIndex.href=`/data/entries/${day}/index.json`; linkIndex.target='_blank'; linkIndex.rel='noopener'; linkIndex.textContent='Índice del día';
        meta.append(linkNoticias, linkSnap, linkIndex);
        // Top countries
        const rowC = document.createElement('div'); rowC.className='smart-tags';
        const labelC = document.createElement('span'); labelC.className='label'; labelC.textContent='Países:'; rowC.appendChild(labelC);
        const entriesC = Object.entries(index.countries||{}).sort((a,b)=>b[1]-a[1]).slice(0,6);
        for (const [c,n] of entriesC){ const a=document.createElement('a'); a.className='chip'; a.href=`/pages/noticias.html?dia=${day}&pais=${encodeURIComponent(c)}`; a.textContent=`${c} (${n})`; rowC.appendChild(a); }
        // Top topics
        const rowT = document.createElement('div'); rowT.className='smart-tags';
        const labelT = document.createElement('span'); labelT.className='label'; labelT.textContent='Temas:'; rowT.appendChild(labelT);
        const entriesT = Object.entries(index.topics||{}).sort((a,b)=>b[1]-a[1]).slice(0,6);
        for (const [t,n] of entriesT){ const a=document.createElement('a'); a.className='chip'; a.href=`/pages/noticias.html?dia=${day}&tema=${encodeURIComponent(t)}`; a.textContent=`${t} (${n})`; rowT.appendChild(a); }
        card.append(head, meta, rowC, rowT);
        container.appendChild(card);
        shown++;
      }
      if (shown===0){ container.innerHTML = '<div class="panel">No hay días que coincidan con el filtro.</div>'; }
    };

    if (selCountry) selCountry.addEventListener('change', render);
    if (selTopic) selTopic.addEventListener('change', render);
    render();
  }catch(e){
    console.error('Error loading archive:', e);
    container.innerHTML = '<div class="panel">No se pudo cargar el archivo.</div>';
  }
}

function createAgentCard(agent) {
  const card = document.createElement('article');
  card.className = 'agent-card';
  
  const state = (agent.estado || 'desconocido').toLowerCase();
  const statusClass = state === 'activo' ? 'ok' : state === 'configurando' ? 'warn' : state === 'fallo' ? 'err' : '';
  const lastExecution = agent.ultimo_ejecucion || agent.lastRun || '';
  const throughput = agent.throughput || '—';
  const notes = agent.notas || '';
  
  // Get curator color class
  const curatorClass = getCuratorClassName(agent.nombre);
  
  card.innerHTML = `
    <div class="agent-header">
      <div class="agent-avatar ${curatorClass}">
        <svg class="icon" aria-hidden="true">
          <use href="/assets/icons.svg#robot"></use>
        </svg>
      </div>
      <div class="agent-info">
        <h3>${agent.nombre || 'Agente desconocido'}</h3>
        <div class="agent-status">
          <span class="chip ${statusClass}">${agent.estado || 'Desconocido'}</span>
        </div>
      </div>
    </div>
    
    <div class="agent-body">
      <div class="agent-specialization">
        ${notes || 'Sin especialización definida'}
      </div>
      
      <div class="agent-metrics">
        <div class="agent-metric">
          <div class="value">${throughput}</div>
          <div class="label">Rendimiento</div>
        </div>
        <div class="agent-metric">
          <div class="value">${lastExecution ? timeAgo(new Date(lastExecution)) : '—'}</div>
          <div class="label">Última actividad</div>
        </div>
      </div>
    </div>
  `;
  
  return card;
}

async function renderAgentMetrics(status) {
  try {
    // Load feed data for metrics
    const feedUrl = (window.AILatamConfig?.api?.feedUrl) || '/data/feed-latest.json';
    const raw = await (await fetch(feedUrl, { cache:'no-store' })).json();
    const arr = Array.isArray(raw) ? raw : (raw.articles || raw.items || []);
    
    const uniq = (xs) => Array.from(new Set(xs));
    const countries = uniq(arr.map(x => (x.country||'').toString().trim()).filter(Boolean));
    const sources = uniq(arr.map(x => (x.source||'').toString().trim()).filter(Boolean));
    const topics = uniq(arr.flatMap(x => x.topics || []));
    
    // Render metrics grid
    const metricsGrid = document.getElementById('agents-metrics');
    if (metricsGrid) {
      metricsGrid.innerHTML = '';
      
      const metrics = [
        { label: 'Artículos', value: arr.length || 0, description: 'Total en el feed' },
        { label: 'Fuentes', value: sources.length || 0, description: 'Fuentes activas' },
        { label: 'Países', value: countries.length || 0, description: 'Cobertura regional' },
        { label: 'Temas', value: topics.length || 0, description: 'Categorías' }
      ];
      
      metrics.forEach(metric => {
        const card = document.createElement('div');
        card.className = 'metric-card';
        card.innerHTML = `
          <div class="value">${metric.value}</div>
          <div class="label">${metric.label}</div>
        `;
        card.title = metric.description;
        metricsGrid.appendChild(card);
      });
    }
    
    // Update status summary
    const summaryEl = document.getElementById('agents-summary');
    if (summaryEl && status) {
      const todayStr = new Date().toISOString().slice(0,10);
      const todayCount = arr.filter(a => (a.published_at||'').slice(0,10) === todayStr).length;
      
      let dayCount = 0;
      try { 
        const cat = await (await fetch('/data/index/catalog.json', { cache:'no-store' })).json(); 
        dayCount = Array.isArray(cat?.days) ? cat.days.length : 0; 
      } catch(_) { }
      
      const lastRun = status.last_run_iso ? new Date(status.last_run_iso).toLocaleString('es-ES') : '—';
      const lastFeed = status.last_feed_update ? new Date(status.last_feed_update).toLocaleString('es-ES') : '—';
      const feedCount = status.feed_count ?? (arr.length || 0);
      
      summaryEl.textContent = `${feedCount} artículos procesados • Última actualización: ${timeAgo(new Date(status.last_feed_update || status.last_run_iso))} • ${dayCount} días de histórico • ${todayCount} publicados hoy`;
    }
    
  } catch (error) {
    console.error('Error rendering metrics:', error);
  }
}

// Pipeline timeline and health
async function renderPipeline(status){
  try{
    const summaryEl = document.getElementById('pipeline-summary');
    const timelineEl = document.getElementById('pipeline-timeline');
    const chartEl = document.getElementById('pipeline-chart');
    const linksEl = document.getElementById('pipeline-links');
    if (!summaryEl || !timelineEl) return;

    // Load runs manifest
    let runs = [];
    try{
      const r = await fetch('/data/index/runs.json', { cache:'no-store' });
      if (r.ok){ const j = await r.json(); runs = Array.isArray(j.runs) ? j.runs : []; }
    }catch(_){ runs = []; }

    // Compute health
    const now = Date.now();
    const lastRunISO = status?.last_run_iso || (runs[0]?.timestamp) || null;
    const lastRunMs = lastRunISO ? new Date(lastRunISO).getTime() : 0;
    const ageMin = lastRunMs ? Math.round((now - lastRunMs)/60000) : null;
    const state = ageMin == null ? 'unknown' : (ageMin <= 90 ? 'ok' : ageMin <= 180 ? 'warn' : 'err');

    const runs24 = runs.filter(r => {
      const t = new Date(r.timestamp||0).getTime();
      return now - t <= 24*60*60*1000;
    });
    const thru = runs24.length ? Math.round(runs24.reduce((a,b)=>a+(b.count||0),0)/runs24.length) : 0;
    const today = new Date().toISOString().slice(0,10);
    const todayRuns = runs.filter(r => (r.timestamp||'').slice(0,10) === today);
    const todayCount = todayRuns.reduce((a,b)=>a+(b.count||0),0);

    // Summary text
    const dotClass = state==='ok'?'ok':state==='warn'?'warn':'err';
    const lastText = lastRunISO ? timeAgo(new Date(lastRunISO)) : '—';
    const nextETA = (()=>{
      const d = new Date(); d.setMinutes(0,0,0); d.setHours(d.getHours()+1);
      return d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
    })();
    // Alerts: throughput trend and gaps
    const last6 = runs.slice(0,6).map(r=>r.count||0);
    const prev6 = runs.slice(6,12).map(r=>r.count||0);
    const avg = (arr)=> arr.length? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
    const avgLast = avg(last6), avgPrev = avg(prev6);
    const dropPct = (avgPrev>0) ? Math.round((1 - (avgLast/avgPrev))*100) : 0;
    const gapWarn = ageMin!=null && ageMin>120;
    const gapErr = ageMin!=null && ageMin>240;

    let alertChips = '';
    if (avgPrev>0 && dropPct >= 40){ alertChips += `<span class="chip warn">Throughput ↓ ${dropPct}%</span>`; }
    if (gapErr){ alertChips += `<span class="chip err">Demora: sin run hace ${Math.floor(ageMin/60)}h</span>`; }
    else if (gapWarn){ alertChips += `<span class="chip warn">Demora: sin run hace ${ageMin} min</span>`; }
    if (last6.filter(x=>x===0).length>=2){ alertChips += `<span class="chip warn">Runs vacíos recientes</span>`; }

    summaryEl.innerHTML = `
      <span class="chip ${dotClass}">Pipeline ${state==='ok'?'operacional':state==='warn'?'lento':'demorado'}</span>
      <span class="chip">Último run: ${lastText}</span>
      <span class="chip">Runs 24h: ${runs24.length}</span>
      <span class="chip">Throughput medio: ${thru}/run</span>
      <span class="chip brand">Hoy: ${todayCount} señales</span>
      <span class="chip">Próxima ejecución: ${nextETA}</span>
      ${alertChips}
    `;

    // Timeline chips (latest 12)
    timelineEl.innerHTML = '';
    const take = runs.slice(0,12);
    for (const r of take){
      const el = document.createElement('a');
      el.className = 'chip ' + ((r.count||0) ? 'brand' : 'warn');
      const t = r.timestamp ? new Date(r.timestamp) : null;
      const time = t ? t.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '—';
      el.textContent = `${time} • ${r.count||0}`;
      el.href = `/data/runs/${encodeURIComponent(r.file)}`;
      el.target = '_blank'; el.rel='noopener';
      timelineEl.appendChild(el);
    }

    // Links to raw JSON
    if (linksEl){
      linksEl.innerHTML='';
      const add = (href, label)=>{ const a=document.createElement('a'); a.href=href; a.target='_blank'; a.rel='noopener'; a.className='chip'; a.textContent=label; linksEl.appendChild(a); };
      add('/data/index/status.json','status.json');
      add('/data/index/runs.json','runs.json');
      add('/data/feed-latest.json','feed-latest.json');
    }

    // Sparkline chart for last 24 runs
    if (chartEl){
      const N = Math.min(24, runs.length);
      const pts = runs.slice(0,N).map(r=> Math.max(0, r.count||0)).reverse(); // oldest->newest
      const max = Math.max(1, ...pts);
      const w = Math.max(120, N*10);
      const h = 40;
      const pad = 4;
      const step = (w - pad*2) / Math.max(1, N-1);
      const y = v => h - pad - (v/max)*(h - pad*2);
      const x = i => pad + i*step;
      let d = '';
      pts.forEach((v,i)=>{ d += (i? ' L':'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); });
      const area = d + ` L ${x(N-1).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;
      chartEl.innerHTML = `
        <svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Actividad del pipeline (últimos ${N} runs)">
          <path d="${area}" fill="var(--brand-fade, rgba(255,215,0,0.12))"></path>
          <path d="${d}" fill="none" stroke="var(--brand, #ffd700)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
        </svg>`;
    }
  }catch(e){
    console.error('Error rendering pipeline:', e);
  }
}

function setupAgentControls(container) {
  const btnNow = document.getElementById('agents-refresh-now');
  const btnToggle = document.getElementById('agents-refresh-toggle');
  
  if (btnNow) {
    btnNow.onclick = () => initAgents(container).catch(console.error);
  }
  
  if (btnToggle) {
    const updateToggleText = () => {
      const on = window.__agentsAuto !== false;
      const toggleText = btnToggle.querySelector('.toggle-text');
      if (toggleText) {
        toggleText.textContent = `Auto-actualizar: ${on ? 'ON' : 'OFF'}`;
      }
      btnToggle.className = `btn secondary ${on ? 'active' : ''}`;
    };
    
    btnToggle.onclick = () => { 
      window.__agentsAuto = window.__agentsAuto === false ? true : false; 
      updateToggleText(); 
    };
    
    updateToggleText();
  }
}

function showAgentsLoadingState() {
  const agentsGrid = document.getElementById('agents-grid');
  const metricsGrid = document.getElementById('agents-metrics');
  
  if (agentsGrid) {
    agentsGrid.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Cargando estado de los agentes...</p>
      </div>
    `;
  }
  
  if (metricsGrid) {
    metricsGrid.innerHTML = Array.from({length: 4}, () => `
      <div class="metric-card loading">
        <div class="value">⏳</div>
        <div class="label">Cargando...</div>
      </div>
    `).join('');
  }
}

function showAgentsErrorState(message) {
  const agentsGrid = document.getElementById('agents-grid');
  
  if (agentsGrid) {
    agentsGrid.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Error al cargar agentes</h3>
        <p>${message}</p>
        <button class="btn primary" onclick="location.reload()">Reintentar</button>
      </div>
    `;
  }
}

// Panorama: carga categorías, descripciones y propuestas de automatización
async function initPanorama(container){
  let cats;
  try{
    const url = (window.AILatamConfig?.api?.panoramaUrl) || '/data/panorama.json';
    const res = await fetch(url, { cache:'no-store' });
    cats = await res.json();
  } catch(e){ cats = window.VULCANO_DEMO?.panorama || []; }
  container.innerHTML='';
  for (const c of cats){
    const card = document.createElement('article');
    card.className='category-card';
    card.innerHTML = `
      <h3 class="title">${c.titulo}</h3>
      <p class="desc">${c.descripcion}</p>
      <div class="meta">
        <span class="badge">Valor: ${c.valor_para_usuarios}</span>
      </div>
      <h4>Elementos a coordinar</h4>
      <ul class="bullets">${(c.claves||[]).map(x=>`<li>${x}</li>`).join('')}</ul>
      <h4>Fuentes y automatización</h4>
      <ul class="bullets">${(c.fuentes||[]).map(x=>`<li>${x}</li>`).join('')}</ul>
      <div class="note">Borrador: esta sección se poblará vía agentes n8n dedicados para ${c.slug}.</div>
    `;
    container.appendChild(card);
  }
  // Quick filters from live topic counts
  try{
    const feedUrl = (window.AILatamConfig?.api?.feedUrl) || '/data/feed-latest.json';
    const raw = await (await fetch(feedUrl, { cache:'no-store' })).json();
    const arr = Array.isArray(raw) ? raw : (raw.articles || raw.items || []);
    const counts = new Map();
    for (const a of arr){ for (const t of (a.topics||[])){ const k=(t||'').toString().trim(); if(k) counts.set(k,(counts.get(k)||0)+1); } }
    const top = Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10);
    if (top.length){
      const row = document.createElement('div'); row.className='quick-tags';
      const label = document.createElement('span'); label.className='label'; label.textContent='Temas populares:'; row.appendChild(label);
      for (const [t,n] of top){ const a=document.createElement('a'); a.className='chip brand'; a.href=`/pages/noticias.html?tema=${encodeURIComponent(t)}`; a.textContent=`${t}`; a.title=`${n} notas`; row.appendChild(a); }
      container.parentNode.insertBefore(row, container);
    }
  }catch(_){ /* non-blocking */ }
}

// Observatorio Legal: línea temporal básica de items normativos
async function initLegal(container){
  let items;
  try{
    const url = (window.AILatamConfig?.api?.legalUrl) || '/data/legal-sample.json';
    const res = await fetch(url, { cache:'no-store' });
    items = await res.json();
  } catch(e){ items = window.VULCANO_DEMO?.legal || []; }
  container.innerHTML='';
  for (const it of items){
    const box = document.createElement('div');
    box.className='timeline-item';
    const head = document.createElement('div'); head.className='head';
    // País como smart chip (brand, enlazable)
    const tagPais = document.createElement('span'); tagPais.className='chip brand';
    const aPais = document.createElement('a'); aPais.href = `/pages/noticias.html?pais=${encodeURIComponent(it.pais||'')}`; aPais.textContent = it.pais || '';
    tagPais.appendChild(aPais);
    // Estado mapeado a paleta de agentes
    const state = (it.estado||'').toLowerCase();
    const stClass = state.includes('apro')||state.includes('vigente') ? 'ok'
                   : (state.includes('debate')||state.includes('proy')||state.includes('consulta')||state.includes('borrador') ? 'warn' : 'brand');
    const tagEstado = document.createElement('span'); tagEstado.className = 'chip ' + stClass; tagEstado.textContent = it.estado || '';
    // Fecha como meta chip
    const dateItem = document.createElement('span'); dateItem.className='chip meta-date';
    const cal = document.createElementNS('http://www.w3.org/2000/svg','svg'); cal.setAttribute('class','icon'); cal.setAttribute('aria-hidden','true'); const use = document.createElementNS('http://www.w3.org/2000/svg','use'); use.setAttributeNS('http://www.w3.org/1999/xlink','href','/assets/icons.svg#calendar'); cal.appendChild(use);
    const d = it.fecha ? new Date(it.fecha).toLocaleDateString('es-ES') : '';
    dateItem.append(cal, document.createTextNode(d));
    dateItem.style.marginLeft = 'auto';
    head.append(tagPais, tagEstado, dateItem);

    const h4 = document.createElement('h4'); h4.className='title'; h4.textContent = it.titulo || '';
    const p = document.createElement('p'); p.textContent = it.resumen || '';
    const meta = document.createElement('div'); meta.className='meta';
    const a = document.createElement('a'); a.className='chip brand'; a.href = it.url || '#'; a.target = '_blank'; a.rel = 'noopener';
    const linkIcon = document.createElementNS('http://www.w3.org/2000/svg','svg'); linkIcon.setAttribute('class','icon'); linkIcon.setAttribute('aria-hidden','true'); const use2 = document.createElementNS('http://www.w3.org/2000/svg','use'); use2.setAttributeNS('http://www.w3.org/1999/xlink','href','/assets/icons.svg#link'); linkIcon.appendChild(use2);
    a.append(linkIcon, document.createTextNode(' Fuente oficial'));
    meta.appendChild(a);

    box.append(head, h4, p, meta);
    container.appendChild(box);
  }
}

// Envío de trabajos independientes: POST JSON a n8n si hay endpoint; si no, guía para PR en GitHub
async function initIndieForm(form){
  const cfg = window.AILatamConfig?.api || {};
  const endpoint = cfg.indieSubmitUrl || '';
  const status = form.querySelector('[data-status]');
  const prBox = document.getElementById('indie-pr');
  // Si no hay endpoint, mostramos preferentemente la ruta PR
  if (!endpoint && prBox){ prBox.style.display = 'block'; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    const data = Object.fromEntries(new FormData(form).entries());
    // Normalización mínima
    const payload = {
      tipo: 'independiente',
      title: data.titulo || '',
      author: data.autor || '',
      email: data.email || '',
      country: data.pais || 'Regional',
      topics: (data.temas || '').split(',').map(s=>s.trim()).filter(Boolean),
      url: data.enlace || '',
      summary: data.resumen || '',
      license: data.licencia || 'unspecified',
      agreement: data.acuerdo === 'on',
      submitted_at: new Date().toISOString()
    };

    if (!endpoint){
      status.textContent = 'No hay endpoint configurado. Usa la opción de Pull Request en GitHub (recomendado).';
      status.className = 'note';
      return;
    }

    try{
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTTP '+res.status);
      status.textContent = 'Enviado correctamente. Gracias por tu contribución.';
      status.className = 'chip ok';
      form.reset();
    } catch (err){
      console.error(err);
      status.textContent = 'No se pudo enviar. Intenta más tarde o usa PR en GitHub.';
      status.className = 'chip err';
    }
  });
}

// Live search: envía prompt al agente y agrega resultados al feed
async function initLiveSearch(form){
  const cfg = window.AILatamConfig?.api || {};
  const endpoint = cfg.searchAgentUrl || '';
  const status = form.querySelector('[data-live-status]');
  const qEl = form.querySelector('#live-q');
  const claimBox = document.getElementById('live-claim');
  const claimForm = document.getElementById('claim-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    const data = Object.fromEntries(new FormData(form).entries());
    const prompt = data.q || '';
    if (!prompt){ status.textContent = 'Escribe un tema o pregunta.'; return; }

    if (!endpoint){
      status.textContent = 'Agente no configurado. Añade searchAgentUrl en config y en CSP connect-src.';
      status.className = 'note'; return;
    }
    try{
      status.textContent = 'Buscando…';
      const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt, country: data.country||'', topics: (data.topics||'').split(',').map(s=>s.trim()).filter(Boolean) }) });
      if(!res.ok) throw new Error('HTTP '+res.status);
      const json = await res.json();
      const items = Array.isArray(json) ? json : (json.items || json.articles || []);
      // Autoría anónima con hash
      const anon = 'anon-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(16).slice(0,8);
      const mapped = items.map(x => ({...x, author: anon, curator: 'Luciano AI'}));
      if (window.AILatamFeed?.addItems){ window.AILatamFeed.addItems(mapped); }
      status.textContent = `Añadido al feed (${mapped.length} resultados). Hash autor: ${anon}`;
      status.className = 'chip ok';
      if (claimBox) claimBox.style.display = 'block';
      if (claimForm){
        claimForm.onsubmit = async (ev)=>{
          ev.preventDefault();
          const cd = Object.fromEntries(new FormData(claimForm).entries());
          const claimStatus = claimForm.querySelector('[data-claim-status]');
          if (!cfg.claimAuthorUrl){ claimStatus.textContent = 'Configura claimAuthorUrl para registrar autoría.'; claimStatus.className='note'; return; }
          try{
            const r = await fetch(cfg.claimAuthorUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ hash: anon, alias: cd.alias||'', email: cd.email||'' }) });
            if(!r.ok) throw new Error('HTTP '+r.status);
            claimStatus.textContent = 'Autoría registrada. ¡Gracias!';
            claimStatus.className = 'chip ok';
          }catch(err){ claimStatus.textContent = 'No se pudo registrar.'; claimStatus.className='chip err'; }
        };
      }
    }catch(err){
      console.error(err);
      status.textContent = 'Fallo en la búsqueda.'; status.className = 'chip err';
    }
  });
}

// Trigger update: ping a n8n para refrescar señales
async function initTriggerUpdate(button){
  const cfg = window.AILatamConfig?.api || {};
  const endpoint = cfg.updateTriggerUrl || '';
  const status = document.getElementById('trigger-status');
  button.addEventListener('click', async ()=>{
    if(!endpoint){ status.textContent = 'Configura updateTriggerUrl y CSP connect-src.'; status.className='note'; return; }
    try{
      status.textContent = 'Enviando ping…';
      const r = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ reason:'user-trigger' }) });
      if(!r.ok) throw new Error('HTTP '+r.status);
      status.textContent = 'Agentes notificados. Actualizando pronto.'; status.className='chip ok';
    }catch(err){ status.textContent = 'No se pudo notificar.'; status.className='chip err'; }
  });
}

function initWhatsApp(form){
  const cfg = window.AILatamConfig?.social || {};
  const link = form.querySelector('#wa-link');
  const render = () => { link.href = getWhatsAppHref((new FormData(form).get('freq') || 'diarias')); };
  form.addEventListener('change', render);
  render();
}

function initWhatsAppSimple(link){
  link.href = getWhatsAppHref('diarias');
}

function getWhatsAppHref(freq){
  const cfg = window.AILatamConfig?.social || {};
  const base = cfg.whatsappLink || 'https://wa.me/573193620926';
  const text = (cfg.whatsappDefaultText || 'Hola Vulcano Ai, quiero recibir noticias {frecuencia}.').replace('{frecuencia}', freq || 'diarias');
  return `${base}?text=${encodeURIComponent(text)}`;
}

function initWhatsAppModal(){
  try{
    const STORAGE_KEY = 'waModalDismissedAt';
    const last = Number(localStorage.getItem(STORAGE_KEY)||0);
    const now = Date.now();
    const threeDays = 3*24*60*60*1000;
    if (now-last < threeDays) return;

    const backdrop = document.createElement('div'); backdrop.className = 'modal-backdrop';
    const win = document.createElement('div'); win.className='modal-window';
    const card = document.createElement('div'); card.className='modal-card'; card.setAttribute('role','dialog'); card.setAttribute('aria-modal','true');
    const head = document.createElement('div'); head.className='modal-head';
    const title = document.createElement('div'); title.className='modal-title'; title.innerHTML = '<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#whatsapp"></use></svg> Notificaciones en WhatsApp';
    const close = document.createElement('button'); close.className='btn link'; close.textContent='Cerrar'; close.setAttribute('aria-label','Cerrar');
    head.append(title, close);
    const body = document.createElement('div');
    body.innerHTML = '<p>Únete a la comunidad de IA más activa de LATAM. Recibe noticias curadas, análisis y tendencias directo en tu WhatsApp.</p><ul style="text-align:left; margin:12px 0; color:var(--muted); font-size:14px"><li>📰 Resúmenes diarios</li><li>⚡ Alertas de noticias importantes</li><li>🎯 Contenido filtrado por país</li><li>🚫 Sin spam, siempre relevante</li></ul>';
    const actions = document.createElement('div'); actions.className='modal-actions';
    const go = document.createElement('a'); go.className='btn primary'; go.target='_blank'; go.rel='noopener'; go.href = getWhatsAppHref('diarias'); go.innerHTML = '<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#whatsapp"></use></svg> Abrir WhatsApp';
    const later = document.createElement('button'); later.className='btn link'; later.textContent='Quizás luego';
    actions.append(go, later);
    card.append(head, body, actions);
    win.appendChild(card);
    document.body.append(backdrop, win);

    const open = ()=>{ backdrop.classList.add('show'); win.classList.add('show'); card.focus?.(); };
    const closeAll = ()=>{ backdrop.classList.remove('show'); win.classList.remove('show'); localStorage.setItem(STORAGE_KEY, String(Date.now())); };
    backdrop.addEventListener('click', closeAll); close.addEventListener('click', closeAll); later.addEventListener('click', closeAll);
    window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeAll(); });

    setTimeout(open, 8000); // Show after 8 seconds
  }catch(e){ /* noop */ }
}

// Manual trigger for testing - you can call this in browser console
window.testWhatsAppModal = function() {
  // Clear the storage to reset cooldown
  localStorage.removeItem('waModalDismissedAt');
  // Trigger the modal immediately
  initWhatsAppModal();
};

// Auto-trigger if URL has ?modal=whatsapp (for testing)
if (window.location.search.includes('modal=whatsapp')) {
  localStorage.removeItem('waModalDismissedAt');
}

// Global Time Zones in Header
function initGlobalTimeZones() {
  const globalTime = document.getElementById('global-time');
  if (!globalTime) return;
  
  function updateTimes() {
    const zones = globalTime.querySelectorAll('.time-zone');
    zones.forEach(zone => {
      const tz = zone.getAttribute('data-tz');
      const timeEl = zone.querySelector('.tz-time');
      if (tz && timeEl) {
        try {
          const time = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).format(new Date());
          timeEl.textContent = time;
        } catch (e) {
          timeEl.textContent = '--:--';
        }
      }
    });
  }
  
  // Update immediately and then every minute
  updateTimes();
  setInterval(updateTimes, 60000);
}

// Enhanced Navigation
function initEnhancedNavigation() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  
  if (!toggle || !nav) return;
  
  // Ensure backdrop exists
  let backdrop = document.querySelector('.nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }
  
  const closeMenu = () => {
    nav.classList.remove('open');
    backdrop.classList.remove('show');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  
  const openMenu = () => {
    nav.classList.add('open');
    backdrop.classList.add('show');
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    
    // Focus first nav item for accessibility
    const firstLink = nav.querySelector('a');
    if (firstLink) firstLink.focus();
  };
  
  // Enhanced toggle functionality
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    
    if (!isOpen) {
      openMenu();
    } else {
      closeMenu();
    }
  });
  
  // Close menu when clicking nav links
  nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      closeMenu();
    }
  });
  
  // Enhanced keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
    
    // Arrow key navigation when menu is open
    if (nav.classList.contains('open') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const links = [...nav.querySelectorAll('a')];
      const current = document.activeElement;
      const currentIndex = links.indexOf(current);
      
      let nextIndex;
      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % links.length;
      } else {
        nextIndex = currentIndex <= 0 ? links.length - 1 : currentIndex - 1;
      }
      
      links[nextIndex]?.focus();
    }
  });
}

// Homepage Hero Stats
async function initHeroStats() {
  const statsElements = {
    articles: document.getElementById('results-counter'),
    sources: document.getElementById('live-sources'),
    countries: document.getElementById('live-countries')
  };
  
  // Only run on homepage
  if (!statsElements.articles) return;
  
  try {
    // Load feed data and status in parallel
    const feedUrl = (window.AILatamConfig?.api?.feedUrl) || '/data/feed-latest.json';
    const [rawFeed, rawStatus] = await Promise.allSettled([
      fetch(feedUrl, { cache: 'no-store' }),
      fetch('/data/index/status.json', { cache: 'no-store' })
    ]);

    let arr = [];
    if (rawFeed.status === 'fulfilled' && rawFeed.value.ok) {
      const data = await rawFeed.value.json();
      arr = Array.isArray(data) ? data : (data.articles || data.items || []);
    }
    let status = null;
    if (rawStatus.status === 'fulfilled' && rawStatus.value.ok) {
      status = await rawStatus.value.json();
    }
    
    // Calculate stats
    const countries = new Set(arr.map(x => (x.country || '').trim()).filter(Boolean));
    const sources = new Set(arr.map(x => (x.source || '').trim()).filter(Boolean));
    
    // Update hero stats with animation
    const animateValue = (element, start, end, duration = 1000) => {
      const range = end - start;
      const minTimer = 50;
      const stepTime = Math.abs(Math.floor(duration / range));
      
      let current = start;
      const timer = setInterval(() => {
        current += 1;
        element.textContent = current.toLocaleString();
        if (current >= end) {
          clearInterval(timer);
        }
      }, Math.max(stepTime, minTimer));
    };
    
    const totalArticles = (status && typeof status.feed_count === 'number') ? status.feed_count : arr.length;
    
    // Animate the values
    setTimeout(() => animateValue(statsElements.articles, 0, totalArticles), 200);
    setTimeout(() => animateValue(statsElements.sources, 0, sources.size), 600);
    setTimeout(() => animateValue(statsElements.countries, 0, countries.size), 1000);
    
  } catch (error) {
    console.error('Error loading hero stats:', error);
    // Fallback values
    if (statsElements.articles) statsElements.articles.textContent = '--';
    if (statsElements.sources) statsElements.sources.textContent = '--';
    if (statsElements.countries) statsElements.countries.textContent = '--';
  }
}

// Crypto Page Initialization
async function initCryptoPage() {
  // Only run on crypto page
  if (!document.querySelector('.crypto-hero')) return;
  
  try {
    // Initialize blockchain animation
    initBlockchainAnimation();
    
    // Load and populate crypto stats
    await loadCryptoStats();
    
    // Initialize NFT studio preview
    initNFTStudio();
    
  } catch (error) {
    console.error('Error initializing crypto page:', error);
  }
}

// Blockchain Grid Animation
function initBlockchainAnimation() {
  const blockchainGrid = document.getElementById('blockchain-grid');
  if (!blockchainGrid) return;
  
  // Create animated blockchain nodes
  for (let i = 0; i < 12; i++) {
    const node = document.createElement('div');
    node.className = 'blockchain-node';
    node.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: #ffd700;
      border-radius: 50%;
      opacity: 0.3;
      animation: blockchainPulse ${2 + Math.random() * 3}s ease-in-out infinite;
      animation-delay: ${Math.random() * 2}s;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
    `;
    blockchainGrid.appendChild(node);
  }
  
  // Add CSS animation for blockchain nodes
  if (!document.querySelector('#blockchain-styles')) {
    const style = document.createElement('style');
    style.id = 'blockchain-styles';
    style.textContent = `
      @keyframes blockchainPulse {
        0%, 100% { opacity: 0.2; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.5); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Load Crypto Statistics
async function loadCryptoStats() {
  const statsElements = {
    cryptoCount: document.getElementById('crypto-count'),
    cryptoCountries: document.getElementById('crypto-countries'),
    cryptoSources: document.getElementById('crypto-sources'),
    regionalCoverage: document.getElementById('regional-coverage'),
    weeklySignals: document.getElementById('weekly-signals')
  };
  
  try {
    // Load feed data
    const feedUrl = (window.AILatamConfig?.api?.feedUrl) || '/data/feed-latest.json';
    const raw = await fetch(feedUrl, { cache: 'no-store' });
    if (!raw.ok) throw new Error('Failed to load feed');
    
    const data = await raw.json();
    const arr = Array.isArray(data) ? data : (data.articles || data.items || []);
    
    // Filter crypto-related content
    const cryptoKeywords = ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'defi', 'nft', 'stablecoin', 'cbdc', 'web3'];
    const cryptoArticles = arr.filter(article => {
      const searchText = (article.title + ' ' + article.summary + ' ' + (article.topics || []).join(' ')).toLowerCase();
      return cryptoKeywords.some(keyword => searchText.includes(keyword));
    });
    
    // Calculate stats
    const countries = new Set(cryptoArticles.map(x => (x.country || '').trim()).filter(Boolean));
    const sources = new Set(cryptoArticles.map(x => (x.source || '').trim()).filter(Boolean));
    
    // Calculate weekly signals (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyArticles = cryptoArticles.filter(article => {
      const publishedDate = new Date(article.published_at || article.date || 0);
      return publishedDate >= weekAgo;
    });
    
    // Animate the values with crypto-themed effect
    const animateValue = (element, start, end, duration = 1500, suffix = '') => {
      if (!element) return;
      
      const range = end - start;
      const minTimer = 50;
      const stepTime = Math.abs(Math.floor(duration / range));
      
      let current = start;
      const timer = setInterval(() => {
        current += 1;
        element.textContent = current.toLocaleString() + suffix;
        
        // Add golden glow effect during animation
        element.style.textShadow = '0 0 10px rgba(255,215,0,0.5)';
        
        if (current >= end) {
          clearInterval(timer);
          // Remove glow after animation
          setTimeout(() => {
            element.style.textShadow = '';
          }, 500);
        }
      }, Math.max(stepTime, minTimer));
    };
    
    // Animate the values with staggered timing
    setTimeout(() => animateValue(statsElements.cryptoCount, 0, cryptoArticles.length), 300);
    setTimeout(() => animateValue(statsElements.cryptoCountries, 0, countries.size), 700);
    setTimeout(() => animateValue(statsElements.cryptoSources, 0, sources.size), 1100);
    setTimeout(() => animateValue(statsElements.regionalCoverage, 0, countries.size), 1500);
    setTimeout(() => animateValue(statsElements.weeklySignals, 0, weeklyArticles.length), 1900);
    
  } catch (error) {
    console.error('Error loading crypto stats:', error);
    // Set fallback values
    Object.values(statsElements).forEach(el => {
      if (el) el.textContent = '--';
    });
  }
}

// NFT Studio Preview
function initNFTStudio() {
  const grid = document.getElementById('crypto-orb-grid');
  if (!grid) return;
  
  // Generate 8 unique NFT previews using algorithmic patterns
  for (let i = 0; i < 8; i++) {
    const nft = document.createElement('div');
    nft.className = 'nft-preview';
    
    // Generate unique patterns based on index
    const hue = (i * 45) % 360;
    const pattern = i % 4;
    
    nft.style.cssText = `
      width: 100%;
      aspect-ratio: 1;
      border-radius: 8px;
      border: 1px solid rgba(255,215,0,0.2);
      background: linear-gradient(${45 * i}deg, 
        hsl(${hue}, 70%, 20%) 0%,
        hsl(${(hue + 60) % 360}, 60%, 15%) 100%);
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    
    // Add pattern overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at ${30 + (i * 15)}% ${40 + (i * 10)}%, 
          rgba(255,215,0,0.1) 0%, 
          transparent 50%);
      mix-blend-mode: overlay;
    `;
    
    nft.appendChild(overlay);
    
    // Add hover effect
    nft.addEventListener('mouseenter', () => {
      nft.style.transform = 'scale(1.05) rotate(2deg)';
      nft.style.borderColor = 'rgba(255,215,0,0.5)';
      nft.style.boxShadow = '0 8px 25px rgba(255,215,0,0.2)';
    });
    
    nft.addEventListener('mouseleave', () => {
      nft.style.transform = '';
      nft.style.borderColor = 'rgba(255,215,0,0.2)';
      nft.style.boxShadow = '';
    });
    
    grid.appendChild(nft);
  }
}

// Legal Observatory Initialization
async function initLegalObservatory() {
  // Only run on legal observatory page
  if (!document.querySelector('.legal-hero')) return;
  
  try {
    // Initialize scales animation
    initScalesAnimation();
    
    // Load and populate legal stats
    await loadLegalStats();
    
    // Initialize interactive timeline
    initInteractiveTimeline();
    
    // Initialize country analysis
    initCountryAnalysis();
    
    // Initialize singularity indicator
    initSingularityIndicator();
    
  } catch (error) {
    console.error('Error initializing legal observatory:', error);
  }
}

// Scales Animation for Legal Hero
function initScalesAnimation() {
  const scalesAnimation = document.getElementById('scales-animation');
  if (!scalesAnimation) return;
  
  // Create animated legal elements
  for (let i = 0; i < 8; i++) {
    const element = document.createElement('div');
    element.className = 'legal-particle';
    element.style.cssText = `
      position: absolute;
      width: 3px;
      height: 3px;
      background: #da3633;
      border-radius: 50%;
      opacity: 0.4;
      animation: legalFloat ${3 + Math.random() * 4}s ease-in-out infinite;
      animation-delay: ${Math.random() * 3}s;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
    `;
    scalesAnimation.appendChild(element);
  }
  
  // Add CSS animation for legal particles
  if (!document.querySelector('#legal-styles')) {
    const style = document.createElement('style');
    style.id = 'legal-styles';
    style.textContent = `
      @keyframes legalFloat {
        0%, 100% { opacity: 0.2; transform: scale(1) translateY(0px); }
        50% { opacity: 0.6; transform: scale(1.2) translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Load Legal Statistics
async function loadLegalStats() {
  const statsElements = {
    legalCount: document.getElementById('legal-count'),
    legalCountries: document.getElementById('legal-countries'),
    roadblockIndicator: document.getElementById('roadblock-indicator'),
    restrictionsCount: document.getElementById('restrictions-count'),
    pendingVotes: document.getElementById('pending-votes'),
    threatLevel: document.getElementById('threat-level')
  };
  
  try {
    // Enhanced N8N pipeline data fetching
    let legalData = [];
    const cfgUrl = (window.AILatamConfig?.api?.legalUrl) || '';
    const endpoints = [
      cfgUrl || '/data/legal-realtime.json',
      '/data/legal-realtime.json', // N8N pipeline endpoint (static JSON published by workflow)
      '/api/legal/initiatives', // Direct N8N webhook if available
      '/data/legal-sample.json' // Last-resort sample
    ];
    
    // Try multiple data sources for redundancy
    for (const endpoint of endpoints) {
      try {
        const raw = await fetch(endpoint, { 
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'X-Source': 'vulcano-legal-observatory'
          }
        });
        
        if (raw.ok) {
          const data = await raw.json();
          if (Array.isArray(data) && data.length > 0) {
            legalData = data;
            console.log(`✅ Legal data loaded from: ${endpoint}`);
            break;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load from ${endpoint}:`, error.message);
      }
    }
    
    // Fallback to sample data if N8N pipelines are unavailable
    if (legalData.length === 0) {
      console.log('📊 Using fallback legal sample data');
    }
    
    const initiatives = Array.isArray(legalData) ? legalData : [];
    
    // Enhanced threat analysis calculations
    const countries = new Set(initiatives.map(x => (x.pais || '').trim()).filter(Boolean));
    
    const restrictiveInitiatives = initiatives.filter(i => {
      const estado = (i.estado || '').toLowerCase();
      const temas = (i.temas || []).map(t => t.toLowerCase());
      
      return estado.includes('debate') || 
             estado.includes('aprobado') ||
             estado.includes('activo') ||
             temas.some(tema => [
               'restricción', 'control', 'sanción', 'prohibición',
               'riesgo', 'transparencia', 'evaluación', 'compliance'
             ].includes(tema));
    });
    
    const pendingVotesCount = initiatives.filter(i => {
      const estado = (i.estado || '').toLowerCase();
      return estado.includes('debate') || 
             estado.includes('votación') ||
             estado.includes('consulta') ||
             estado.includes('borrador');
    }).length;
    
    // Calculate roadblock level (0-100)
    const roadblockLevel = Math.min(100, Math.round((restrictiveInitiatives.length / Math.max(initiatives.length, 1)) * 100));
    
    // Determine threat level
    let threatColor = '#22c55e';
    let threatText = 'Bajo riesgo';
    if (roadblockLevel > 60) {
      threatColor = '#da3633';
      threatText = 'Alto riesgo';
    } else if (roadblockLevel > 30) {
      threatColor = '#ffd700';
      threatText = 'Riesgo moderado';
    }
    
    // Animate the values with legal-themed effect
    const animateValue = (element, start, end, duration = 2000, suffix = '') => {
      if (!element) return;
      
      const range = end - start;
      const minTimer = 60;
      const stepTime = Math.abs(Math.floor(duration / range));
      
      let current = start;
      const timer = setInterval(() => {
        current += 1;
        element.textContent = current.toLocaleString() + suffix;
        
        // Add red glow effect during animation
        element.style.textShadow = '0 0 8px rgba(218,54,51,0.4)';
        
        if (current >= end) {
          clearInterval(timer);
          // Remove glow after animation
          setTimeout(() => {
            element.style.textShadow = '';
          }, 500);
        }
      }, Math.max(stepTime, minTimer));
    };
    
    // Animate the values with staggered timing
    setTimeout(() => animateValue(statsElements.legalCount, 0, initiatives.length), 400);
    setTimeout(() => animateValue(statsElements.legalCountries, 0, countries.size), 800);
    setTimeout(() => animateValue(statsElements.restrictionsCount, 0, restrictiveInitiatives.length), 1200);
    setTimeout(() => animateValue(statsElements.pendingVotes, 0, pendingVotesCount), 1600);
    
    // Update roadblock indicator
    if (statsElements.roadblockIndicator) {
      const valueEl = statsElements.roadblockIndicator.querySelector('.stat-value');
      if (valueEl) {
        setTimeout(() => {
          animateValue(valueEl, 0, roadblockLevel, 2000, '%');
          statsElements.roadblockIndicator.style.borderColor = `${threatColor}44`;
        }, 2000);
      }
    }
    
    // Update threat level
    if (statsElements.threatLevel) {
      setTimeout(() => {
        const dot = statsElements.threatLevel.querySelector('.threat-dot');
        const text = statsElements.threatLevel.querySelector('span');
        if (dot && text) {
          dot.style.background = threatColor;
          text.textContent = threatText;
        }
      }, 2400);
    }
    
    // Store data for other functions
    window.legalObservatoryData = {
      initiatives,
      countries: Array.from(countries),
      roadblockLevel,
      threatColor,
      threatText
    };
    
  } catch (error) {
    console.error('Error loading legal stats:', error);
    // Set fallback values
    Object.values(statsElements).forEach(el => {
      if (el && el.querySelector) {
        const valueEl = el.querySelector('.stat-value') || el.querySelector('.metric-value');
        if (valueEl) valueEl.textContent = '--';
      }
    });
  }
}

// Interactive Timeline
function initInteractiveTimeline() {
  const timeline = document.getElementById('interactive-timeline');
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  if (!timeline || !window.legalObservatoryData) return;
  
  const { initiatives } = window.legalObservatoryData;
  
  function renderTimeline(filteredInitiatives = initiatives) {
    timeline.innerHTML = '';
    
    // Sort by date (newest first)
    const sortedInitiatives = [...filteredInitiatives].sort((a, b) => {
      const dateA = new Date(a.fecha || 0);
      const dateB = new Date(b.fecha || 0);
      return dateB - dateA;
    });
    
    sortedInitiatives.forEach((initiative, index) => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      item.style.animationDelay = `${index * 0.1}s`;
      
      const date = new Date(initiative.fecha || Date.now());
      const formattedDate = date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Determine item type for color coding
      const estado = (initiative.estado || '').toLowerCase();
      let stateClass = 'neutral';
      if (estado.includes('aprobado')) stateClass = 'restrictive';
      else if (estado.includes('debate')) stateClass = 'warning';
      else if (estado.includes('borrador')) stateClass = 'draft';
      
      item.innerHTML = `
        <div class="timeline-header">
          <div class="timeline-tags">
            <span class="country-tag">${initiative.pais || 'Sin país'}</span>
            <span class="state-tag ${stateClass}">${initiative.estado || 'Sin estado'}</span>
          </div>
          <div class="timeline-date">
            <svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#calendar"></use></svg>
            ${formattedDate}
          </div>
        </div>
        <h4 class="timeline-title">${initiative.titulo || 'Sin título'}</h4>
        <p class="timeline-summary">${initiative.resumen || 'Sin resumen disponible'}</p>
        <div class="timeline-meta">
          <span class="organismo">${initiative.organismo || 'Organismo no especificado'}</span>
          ${initiative.url ? `<a href="${initiative.url}" target="_blank" rel="noopener" class="timeline-link">
            <svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#link"></use></svg>
            Fuente oficial
          </a>` : ''}
        </div>
        ${initiative.temas && initiative.temas.length ? `
          <div class="timeline-topics">
            ${initiative.temas.map(tema => `<span class="topic-tag">${tema}</span>`).join('')}
          </div>
        ` : ''}
      `;
      
      timeline.appendChild(item);
    });
    
    // Add CSS for timeline items if not exists
    if (!document.querySelector('#timeline-styles')) {
      const style = document.createElement('style');
      style.id = 'timeline-styles';
      style.textContent = `
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          gap: 16px;
        }
        .timeline-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .country-tag, .state-tag {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .country-tag {
          background: rgba(31,111,235,.15);
          color: #60a5fa;
          border: 1px solid rgba(31,111,235,.3);
        }
        .state-tag.restrictive {
          background: rgba(218,54,51,.15);
          color: #f87171;
          border: 1px solid rgba(218,54,51,.3);
        }
        .state-tag.warning {
          background: rgba(255,215,0,.15);
          color: #fbbf24;
          border: 1px solid rgba(255,215,0,.3);
        }
        .state-tag.draft {
          background: rgba(156,163,175,.15);
          color: #9ca3af;
          border: 1px solid rgba(156,163,175,.3);
        }
        .state-tag.neutral {
          background: rgba(255,255,255,.05);
          color: var(--muted);
          border: 1px solid var(--line);
        }
        .timeline-date {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--muted);
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .timeline-title {
          margin: 0 0 12px 0;
          font-size: 1.3rem;
          font-weight: 700;
          line-height: 1.3;
        }
        .timeline-summary {
          margin: 0 0 16px 0;
          color: var(--muted);
          line-height: 1.5;
        }
        .timeline-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          gap: 16px;
        }
        .organismo {
          font-size: 0.9rem;
          color: var(--muted);
          font-style: italic;
        }
        .timeline-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #da3633;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .timeline-link:hover {
          color: #f87171;
        }
        .timeline-topics {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .topic-tag {
          padding: 2px 8px;
          background: rgba(255,255,255,.05);
          border: 1px solid var(--line);
          border-radius: 8px;
          font-size: 0.75rem;
          color: var(--muted);
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Filter functionality
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.getAttribute('data-filter');
      let filteredData = initiatives;
      
      if (filter !== 'all') {
        filteredData = initiatives.filter(initiative => 
          (initiative.pais || '').toLowerCase().includes(filter.toLowerCase())
        );
      }
      
      renderTimeline(filteredData);
    });
  });
  
  // Initial render
  renderTimeline();
}

// Country Analysis
function initCountryAnalysis() {
  const countryGrid = document.getElementById('country-grid');
  if (!countryGrid || !window.legalObservatoryData) return;
  
  const { initiatives, countries } = window.legalObservatoryData;
  
  countries.forEach(country => {
    const countryInitiatives = initiatives.filter(i => i.pais === country);
    const restrictiveCount = countryInitiatives.filter(i => 
      (i.estado || '').toLowerCase().includes('debate') || 
      (i.estado || '').toLowerCase().includes('aprobado')
    ).length;
    
    const riskLevel = countryInitiatives.length > 0 ? 
      Math.round((restrictiveCount / countryInitiatives.length) * 100) : 0;
    
    let riskClass = 'low';
    let riskColor = '#22c55e';
    if (riskLevel > 60) {
      riskClass = 'high';
      riskColor = '#da3633';
    } else if (riskLevel > 30) {
      riskClass = 'medium';
      riskColor = '#ffd700';
    }
    
    const card = document.createElement('div');
    card.className = 'country-card';
    card.innerHTML = `
      <div class="country-header">
        <h4 class="country-name">${country}</h4>
        <div class="risk-indicator ${riskClass}" style="background: ${riskColor}22; border-color: ${riskColor}44;">
          ${riskLevel}% restrictivo
        </div>
      </div>
      <div class="country-stats">
        <div class="country-stat">
          <span class="stat-value">${countryInitiatives.length}</span>
          <span class="stat-label">Iniciativas</span>
        </div>
        <div class="country-stat">
          <span class="stat-value">${restrictiveCount}</span>
          <span class="stat-label">Restrictivas</span>
        </div>
      </div>
    `;
    
    countryGrid.appendChild(card);
  });
}

// Singularity Proximity Indicator
function initSingularityIndicator() {
  const progressFill = document.getElementById('singularity-progress');
  if (!progressFill || !window.legalObservatoryData) return;
  
  const { roadblockLevel } = window.legalObservatoryData;
  
  // Calculate proximity (inverse of roadblock level)
  const proximityLevel = Math.max(10, 100 - roadblockLevel);
  
  setTimeout(() => {
    progressFill.style.width = `${proximityLevel}%`;
  }, 3000);
}

// Generic copy-to-clipboard for [data-copy] buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const val = btn.getAttribute('data-copy');
  if (!val) return;
  navigator.clipboard.writeText(val).then(()=>{
    btn.textContent = 'Copiado';
    setTimeout(()=>{ btn.textContent = 'Copiar'; }, 1200);
  }).catch(()=>{
    // fallback: select text if next sibling code
    const prev = btn.previousElementSibling;
    if (prev && prev.textContent){
      const range = document.createRange(); range.selectNodeContents(prev); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    }
  });
});

// Sources Page Stats
async function initSourcesPage() {
  // Only run on sources page
  if (!document.querySelector('.sources-hero')) return;
  
  const statsElements = {
    sourcesCount: document.getElementById('sources-count'),
    articlesProcessed: document.getElementById('articles-processed'),
    accuracyRate: document.getElementById('accuracy-rate')
  };
  
  if (!statsElements.sourcesCount) return;
  
  try {
    // Load feed and sources data
    const [feedRaw, sourcesRaw] = await Promise.all([
      fetch('/data/feed-latest.json', { cache: 'no-store' }),
      fetch('/data/sources.json', { cache: 'no-store' }).catch(() => null)
    ]);
    
    const feedData = await feedRaw.json();
    const articles = Array.isArray(feedData) ? feedData : (feedData.articles || []);
    
    let sourcesData = [];
    if (sourcesRaw && sourcesRaw.ok) {
      sourcesData = await sourcesRaw.json();
    }
    
    // Calculate real metrics
    const uniqueSources = new Set(articles.map(x => (x.source || '').trim()).filter(Boolean));
    // v2.0 reset-first: derive counts ONLY from live feed
    const totalSources = uniqueSources.size;
    const totalArticles = articles.length;
    
    // Calculate accuracy rate based on articles with valid data
    const validArticles = articles.filter(a => a.title && a.source && a.country);
    const accuracyPercentage = totalArticles > 0 ? Math.round((validArticles.length / totalArticles) * 100) : 0;
    
    // Animate values
    const animateValue = (element, start, end, duration = 1000, suffix = '') => {
      const range = end - start;
      const minTimer = 50;
      const stepTime = Math.abs(Math.floor(duration / range));
      
      let current = start;
      const timer = setInterval(() => {
        current += 1;
        element.textContent = current.toLocaleString() + suffix;
        if (current >= end) {
          clearInterval(timer);
        }
      }, Math.max(stepTime, minTimer));
    };
    
    // Animate the stats
    setTimeout(() => animateValue(statsElements.sourcesCount, 0, totalSources), 200);
    setTimeout(() => animateValue(statsElements.articlesProcessed, 0, totalArticles), 600);
    setTimeout(() => animateValue(statsElements.accuracyRate, 0, accuracyPercentage, 1000, '%'), 1000);
    
  } catch (error) {
    console.error('Error loading sources stats:', error);
    // Fallback values
    if (statsElements.sourcesCount) statsElements.sourcesCount.textContent = '0';
    if (statsElements.articlesProcessed) statsElements.articlesProcessed.textContent = '0';
    if (statsElements.accuracyRate) statsElements.accuracyRate.textContent = '0%';
  }
}

// Support Page Stats
async function initSupportPage() {
  // Only run on support page
  if (!document.querySelector('.support-hero')) return;
  
  const statsElements = {
    supportersCount: document.getElementById('supporters-count'),
    monthlyGoal: document.getElementById('monthly-goal'),
    independenceLevel: document.getElementById('independence-level')
  };
  
  if (!statsElements.supportersCount) return;
  
  try {
    // Load feed data to calculate community engagement
    const feedRaw = await fetch('/data/feed-latest.json', { cache: 'no-store' });
    const feedData = await feedRaw.json();
    const articles = Array.isArray(feedData) ? feedData : (feedData.articles || []);
    
    // Calculate stats based on activity
    const uniqueSources = new Set(articles.map(x => (x.source || '').trim()).filter(Boolean));
    const monthlyActivity = articles.filter(a => {
      const published = new Date(a.published_at || a.date || 0);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return published >= monthAgo;
    }).length;
    
    // Estimated metrics (can be adjusted based on real data when available)
    const estimatedSupporters = Math.max(25, Math.floor(uniqueSources.size * 2.3)); // Conservative estimate
    const monthlyGoalAmount = 500; // USD target
    const independencePercentage = Math.min(100, Math.floor((monthlyActivity / 50) * 100)); // Based on activity
    
    // Animate values
    const animateValue = (element, start, end, duration = 1000, prefix = '', suffix = '') => {
      const range = end - start;
      const minTimer = 50;
      const stepTime = Math.abs(Math.floor(duration / range));
      
      let current = start;
      const timer = setInterval(() => {
        current += 1;
        element.textContent = prefix + current.toLocaleString() + suffix;
        if (current >= end) {
          clearInterval(timer);
        }
      }, Math.max(stepTime, minTimer));
    };
    
    // Animate the stats
    setTimeout(() => animateValue(statsElements.supportersCount, 0, estimatedSupporters), 200);
    setTimeout(() => animateValue(statsElements.monthlyGoal, 0, monthlyGoalAmount, 1000, '$', ' USD'), 600);
    setTimeout(() => animateValue(statsElements.independenceLevel, 0, independencePercentage, 1000, '', '%'), 1000);
    
  } catch (error) {
    console.error('Error loading support stats:', error);
    // Fallback values
    if (statsElements.supportersCount) statsElements.supportersCount.textContent = '25+';
    if (statsElements.monthlyGoal) statsElements.monthlyGoal.textContent = '$500 USD';
    if (statsElements.independenceLevel) statsElements.independenceLevel.textContent = '75%';
  }
}

// Company Page Stats
function initCompanyPage() {
  // Only run on company page
  if (!document.querySelector('.company-hero')) return;
  
  const statsElements = {
    sinceYear: document.getElementById('since-year'),
    teamSize: document.getElementById('team-size'),
    openSource: document.getElementById('open-source')
  };
  
  // These are static values, but we can animate them for consistency
  if (statsElements.sinceYear) {
    // Animate from 2024 to 2025
    let year = 2024;
    const timer = setInterval(() => {
      year++;
      statsElements.sinceYear.textContent = year;
      if (year >= 2025) clearInterval(timer);
    }, 500);
  }
  
  // Animate "Multi-AI" typing effect
  if (statsElements.teamSize) {
    const text = 'Multi-AI';
    let i = 0;
    statsElements.teamSize.textContent = '';
    const typeTimer = setInterval(() => {
      if (i < text.length) {
        statsElements.teamSize.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typeTimer);
      }
    }, 100);
  }
  
  // Animate percentage from 0 to 100
  if (statsElements.openSource) {
    let percent = 0;
    const percentTimer = setInterval(() => {
      percent += 5;
      statsElements.openSource.textContent = percent + '%';
      if (percent >= 100) clearInterval(percentTimer);
    }, 50);
  }
}

// Footer Updates
async function initFooterUpdates() {
  const footerUpdate = document.getElementById('footer-update');
  if (!footerUpdate) return;
  
  try {
    // Get the last modification time from the feed
    const feedRaw = await fetch('/data/feed-latest.json', { cache: 'no-store' });
    if (feedRaw.ok) {
      const lastModified = feedRaw.headers.get('last-modified');
      if (lastModified) {
        const updateTime = new Date(lastModified);
        const timeString = updateTime.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Bogota'
        });
        footerUpdate.textContent = `Última actualización: ${timeString}`;
        return;
      }
    }
    
    // Fallback: show current time
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
    footerUpdate.textContent = `Última actualización: ${timeString}`;
    
  } catch (error) {
    console.error('Error loading footer update time:', error);
    // Show current time as fallback
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    footerUpdate.textContent = `Última actualización: ${timeString}`;
  }
}

// (drag helpers removed)
