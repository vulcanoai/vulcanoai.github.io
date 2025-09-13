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

  // Initialize feed if present
  if (window.AILatamFeed && typeof window.AILatamFeed.initFeed === 'function'){
    window.AILatamFeed.initFeed();
  }
  // Regulatory highlights block (home)
  if (window.AILatamFeed && typeof window.AILatamFeed.initRegHighlights === 'function'){
     window.AILatamFeed.initRegHighlights();
  }

  // Initialize sources page if present
  const sourcesList = document.getElementById('sources-list');
  if (sourcesList){ initSources(sourcesList).catch(console.error); }

  // Initialize agents page if present
  const agentsTable = document.getElementById('agents-table');
  if (agentsTable){ initAgents(agentsTable).catch(console.error); }

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

  // Mobile/tablet nav toggle - Enhanced
  try{
    const btn = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.site-nav');
    if (btn && nav){
      let backdrop = document.querySelector('.nav-backdrop');
      if (!backdrop){
        backdrop = document.createElement('div');
        backdrop.className = 'nav-backdrop';
        document.body.appendChild(backdrop);
      }
      
      const close = ()=>{ 
        nav.classList.remove('open'); 
        backdrop.classList.remove('show'); 
        document.body.classList.remove('nav-open');
        btn.setAttribute('aria-expanded', 'false');
      };
      
      const open = ()=>{ 
        nav.classList.add('open'); 
        backdrop.classList.add('show'); 
        document.body.classList.add('nav-open');
        btn.setAttribute('aria-expanded', 'true');
        // Focus first nav item for accessibility
        const firstLink = nav.querySelector('a');
        if (firstLink) firstLink.focus();
      };
      
      // Hamburger button click
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const willOpen = !nav.classList.contains('open');
        if (willOpen) open(); else close();
      });
      
      // Enhanced backdrop click with touch support
      backdrop.addEventListener('click', close);
      backdrop.addEventListener('touchstart', close, { passive: true });
      
      // Enhanced keyboard navigation
      window.addEventListener('keydown', (e)=>{ 
        if(e.key==='Escape') close();
        // Navigate with arrow keys when menu is open
        if (nav.classList.contains('open') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
          e.preventDefault();
          const links = [...nav.querySelectorAll('a')];
          const current = document.activeElement;
          const currentIndex = links.indexOf(current);
          const nextIndex = e.key === 'ArrowDown' ? 
            (currentIndex + 1) % links.length : 
            (currentIndex - 1 + links.length) % links.length;
          links[nextIndex]?.focus();
        }
      });
      
      // Close menu when clicking nav links
      nav.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          close();
        }
      });
      
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

async function initAgents(table){
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
  const [agents, status] = await Promise.all([loadAgents(), loadStatus()]);

  // Summary header cell (replaces legacy column headings)
  const summaryTh = document.getElementById('agents-summary');
  if (summaryTh) summaryTh.textContent = 'Cargando…';
  // Remove legacy status box to avoid duplication
  const statusBox = document.getElementById('agents-status');
  if (statusBox) { try { statusBox.remove(); } catch(_) { statusBox.style.display='none'; } }

  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';
  for (const a of agents){
    const tr = document.createElement('tr');
    const st = (a.estado || 'desconocido').toLowerCase();
    const last = a.ultimo_ejecucion || a.lastRun || '';

    const tdName = document.createElement('td');
    if (a.nombre && a.nombre.includes(' AI')) {
      const curatorClass = getCuratorClass ? getCuratorClass(a.nombre) : getCuratorClassName(a.nombre);
      const nameChip = document.createElement('span');
      nameChip.className = `chip ${curatorClass}`;
      const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
      icon.setAttribute('class','icon');
      icon.setAttribute('aria-hidden','true');
      const use = document.createElementNS('http://www.w3.org/2000/svg','use');
      use.setAttributeNS('http://www.w3.org/1999/xlink','href','/assets/icons.svg#robot');
      icon.appendChild(use);
      nameChip.append(icon, document.createTextNode(' ' + a.nombre));
      tdName.appendChild(nameChip);
    } else {
      tdName.textContent = a.nombre || '';
    }
    const tdState = document.createElement('td');
    const chip = document.createElement('span'); chip.className = 'chip ' + (st==='activo'?'ok':st==='configurando'?'warn':st==='fallo'?'err':''); chip.textContent = a.estado || '';
    tdState.appendChild(chip);
    const tdLast = document.createElement('td'); tdLast.textContent = last ? new Date(last).toLocaleString('es-ES') : '—';
    const tdRate = document.createElement('td'); tdRate.textContent = a.throughput ? (typeof a.throughput === 'string' ? a.throughput : a.throughput + '/h') : '—';
    const tdNotes = document.createElement('td'); tdNotes.className = 'muted'; tdNotes.textContent = a.notas || '';

    tr.append(tdName, tdState, tdLast, tdRate, tdNotes);
    tbody.appendChild(tr);
  }

  // Metrics from live feed (optional)
  try{
    const feedUrl = (window.AILatamConfig?.api?.feedUrl) || '/data/feed-latest.json';
    const raw = await (await fetch(feedUrl, { cache:'no-store' })).json();
    const arr = Array.isArray(raw) ? raw : (raw.articles || raw.items || []);
    const uniq = (xs) => Array.from(new Set(xs));
    const countries = uniq(arr.map(x => (x.country||'').toString().trim()).filter(Boolean));
    const sources = uniq(arr.map(x => (x.source||'').toString().trim()).filter(Boolean));
    const topics = uniq(arr.flatMap(x => x.topics || []));
    const m = document.getElementById('agents-metrics');
    if (m){
      m.innerHTML = '';
      const mk = (label, value) => { const d=document.createElement('div'); d.className='gh-card'; d.innerHTML=`<div class="label">${label}</div><div class="value">${value}</div>`; return d; };
      m.append(mk('Artículos', arr.length||0), mk('Fuentes', sources.length||0), mk('Países', countries.length||0), mk('Temas', topics.length||0));
    }
    // Build compact summary line
    const todayStr = new Date().toISOString().slice(0,10);
    const todayCount = arr.filter(a => (a.published_at||'').slice(0,10) === todayStr).length;
    let dayCount = 0;
    try { const cat = await (await fetch('/data/index/catalog.json', { cache:'no-store' })).json(); dayCount = Array.isArray(cat?.days) ? cat.days.length : 0; } catch(_){ }
    const lastRun = status?.last_run_iso ? new Date(status.last_run_iso).toLocaleString('es-ES') : '—';
    const lastFeed = status?.last_feed_update ? new Date(status.last_feed_update).toLocaleString('es-ES') : '—';
    const feedCount = status?.feed_count ?? (arr.length||0);
    if (summaryTh){ summaryTh.textContent = `Datos: ${feedCount} • Última corrida: ${lastRun} • Últ. feed: ${lastFeed} • Días: ${dayCount} • Hoy: ${todayCount}`; }
  }catch(_){ /* non-blocking */ }

  // Controls: manual refresh + toggle auto-refresh
  const btnNow = document.getElementById('agents-refresh-now');
  const btnToggle = document.getElementById('agents-refresh-toggle');
  if (btnNow){ btnNow.onclick = () => initAgents(table).catch(console.error); }
  if (btnToggle){
    const apply = () => {
      const on = window.__agentsAuto !== false;
      btnToggle.textContent = `Auto‑actualizar: ${on ? 'ON' : 'OFF'}`;
    };
    btnToggle.onclick = () => { window.__agentsAuto = window.__agentsAuto === false ? true : false; apply(); };
    apply();
  }

  // Auto-refresh every 60s if enabled
  clearInterval(window.__agentsRefresh);
  if (window.__agentsAuto !== false){
    window.__agentsRefresh = setInterval(() => { initAgents(table).catch(console.error); }, 60000);
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
// (drag helpers removed)
