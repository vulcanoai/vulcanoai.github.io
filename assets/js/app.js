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

  // Mobile/tablet nav toggle
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
      const close = ()=>{ nav.classList.remove('open'); backdrop.classList.remove('show'); document.body.classList.remove('nav-open'); };
      btn.addEventListener('click', () => {
        const willOpen = !nav.classList.contains('open');
        if (willOpen){ nav.classList.add('open'); backdrop.classList.add('show'); document.body.classList.add('nav-open'); }
        else { close(); }
      });
      backdrop.addEventListener('click', close);
      window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
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

  // Contemplative mode toggle
  const cm = document.getElementById('toggle-contemplative');
  if (cm){
    cm.addEventListener('click', () => {
      const on = document.body.classList.toggle('mode-contemplative');
      cm.setAttribute('aria-pressed', on ? 'true' : 'false');
      cm.textContent = on ? 'Salir de modo contemplativo' : 'Modo contemplativo';
    });
  }

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
    const url = cfg.feedUrl || '/data/sample-feed.json';
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
  let data;
  try{
    const url = (window.AILatamConfig?.api?.sourcesUrl) || '/data/sources.json';
    const res = await fetch(url, { cache:'no-store' });
    data = await res.json();
  } catch(e){
    data = window.VULCANO_DEMO?.sources || [];
  }
  const byType = new Map();
  for (const src of data){
    const t = src.tipo || 'otro';
    if(!byType.has(t)) byType.set(t, []);
    byType.get(t).push(src);
  }
  container.innerHTML = '';
  for (const [tipo, arr] of byType){
    const section = document.createElement('section');
    section.className = 'panel';
    const h = document.createElement('h3'); h.textContent = tipo.toUpperCase(); section.appendChild(h);
    const ul = document.createElement('ul');
    for (const s of arr){
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = s.nombre;
      const sp = document.createElement('span'); sp.className = 'muted'; sp.textContent = ` (${s.pais || 'Regional'})`;
      li.appendChild(a); li.appendChild(sp);
      ul.appendChild(li);
    }
    section.appendChild(ul);
    container.appendChild(section);
  }
}

async function initAgents(table){
  let agents;
  try{
    const url = (window.AILatamConfig?.api?.agentsUrl) || '/data/agents.json';
    const res = await fetch(url, { cache:'no-store' });
    agents = await res.json();
  } catch(e){
    agents = window.VULCANO_DEMO?.agents || [];
  }
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';
  for (const a of agents){
    const tr = document.createElement('tr');
    const st = (a.estado || 'desconocido').toLowerCase();
    const last = a.ultimo_ejecucion || a.lastRun || '';

    const tdName = document.createElement('td'); tdName.textContent = a.nombre || '';
    const tdState = document.createElement('td'); const chip = document.createElement('span'); chip.className = 'chip ' + (st==='activo'?'ok':st==='fallo'?'err':st==='pausado'?'warn':''); chip.textContent = a.estado || ''; tdState.appendChild(chip);
    const tdLast = document.createElement('td'); tdLast.textContent = last ? new Date(last).toLocaleString('es-ES') : '—';
    const tdRate = document.createElement('td'); tdRate.textContent = a.throughput ? (a.throughput + '/h') : '—';
    const tdNotes = document.createElement('td'); tdNotes.className = 'muted'; tdNotes.textContent = a.notas || '';

    tr.append(tdName, tdState, tdLast, tdRate, tdNotes);
    tbody.appendChild(tr);
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
      const mapped = items.map(x => ({...x, author: anon, curator: 'Lucas AI'}));
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
    body.innerHTML = '<p>Vulcano Ai te envía noticias de IA en LATAM directo a tu WhatsApp. Súmate con un toque.</p>';
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

    setTimeout(open, 5000);
  }catch(e){ /* noop */ }
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
