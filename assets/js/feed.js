/*
  feed.js — Lógica del feed de noticias
  Notas para agentes:
  - Normaliza entradas heterogéneas (RSS, scrapers, APIs).
  - Usa facets dinámicos para filtros; evitar hardcodear.
  - Si el endpoint es grande, paginar y hacer streaming incremental.
  - Pendiente: persistir filtros en querystring y localStorage.
*/
(() => {
  const cfg = () => (window.AILatamConfig || {}).api || {};

  const state = {
    all: [],
    filtered: [],
    newSince: 0,
    facets: { countries: [], topics: [], sources: [], languages: [] },
    filters: { country: 'todos', topic: 'todos', source: 'todas', q: '', sort: 'recent' },
    els: {}
  };

  function $(sel){ return document.querySelector(sel); }
  function create(el, cls){ const n=document.createElement(el); if(cls) n.className=cls; return n; }
  // CSS-friendly slug (accents stripped, lowercase, hyphenated)
  function slugify(str){
    return (str||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  }
  // Same short hash as workflow (slug-hash filenames)
  function shortHash(s){ let h=0; s=(s||'').toString(); for (let i=0;i<s.length;i++){ h=((h<<5)-h) + s.charCodeAt(i); h|=0; } return ('00000000'+(h>>>0).toString(16)).slice(-8); }

  const fmtDate = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const diff = (Date.now() - d.getTime())/1000;
    if (diff < 60) return 'hace segundos';
    if (diff < 3600) return `hace ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff/3600)} h`;
    return d.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
  };

  const normalize = (a) => {
    const val = (x, def='') => (x == null ? def : String(x)).trim();
    const title = val(a.title || a.titulo, 'Sin título');
    const url = val(a.url || a.link, '#');
    const country = val(a.country || a.pais, 'Regional');
    const topics = (a.topics || a.temas || []).map(t => val(t)).filter(Boolean);
    const language = val(a.language || a.idioma || 'es').slice(0,2).toLowerCase();
    let published_at = val(a.published_at || a.fecha);
    if (!published_at) published_at = new Date().toISOString();
    return {
      id: a.id || url || crypto.randomUUID(),
      title,
      summary: val(a.summary || a.resumen),
      url,
      source: val(a.source || a.fuente, '—'),
      source_url: val(a.source_url || a.fuente_url),
      country,
      topics,
      language,
      published_at,
      relevance: a.relevance || a.relevancia || 0,
      sentiment: val(a.sentiment || a.sentimiento || 'neutral'),
      author: val(a.author || a.autor),
      curator: val(a.curator || a.curador || 'Luciano AI')
    };
  };

  async function fetchJSON(url){
    const res = await fetch(url, { cache:'no-store' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function loadFeed(){
    const config = cfg();
    
    // Generate list of potential data sources: latest + last 7 days of snapshots + sample
    const today = new Date();
    const sources = [
      { url: config.feedUrl || '/data/feed-latest.json', type: 'latest' }
    ];
    
    // Add last 7 days of snapshots
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      sources.push({ 
        url: `/data/feed-${dateStr}.json`, 
        type: 'snapshot', 
        date: dateStr 
      });
    }
    
    // No sample fallback: rely only on live + snapshots
    
    // Show loading state
    showLoadingState('Cargando noticias...');
    
    const allArticles = [];
    const seenUrls = new Set();
    let foundData = false;
    
    // Try each source and aggregate unique articles
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      
      try {
        const raw = await fetchJSON(source.url);
        
        // Handle different response formats from n8n workflow
        let articles = [];
        if (Array.isArray(raw)) {
          articles = raw;
        } else if (raw.articles) {
          articles = raw.articles;
        } else if (raw.items) {
          articles = raw.items;
        }
        
        // Deduplicate by URL and add source info
        let newArticles = 0;
        for (const article of articles) {
          if (article.url && !seenUrls.has(article.url)) {
            seenUrls.add(article.url);
            allArticles.push({
              ...normalize(article),
              _dataSource: source.type,
              _dataDate: source.date,
              _loadedFrom: source.url
            });
            newArticles++;
          }
        }
        
        if (newArticles > 0) {
          console.log(`✓ Cargados ${newArticles} artículos desde: ${source.url} (${source.type})`);
          foundData = true;
        }
        
      } catch (e) {
        // Silently continue to next source unless it's the sample fallback
        if (source.type === 'sample') {
          console.warn(`✗ Error cargando fallback ${source.url}:`, e.message);
        }
      }
    }
    
    hideLoadingState();
    
    if (allArticles.length === 0) {
      // Final fallback: show error (no demo data)
      showErrorState('No se pudieron cargar noticias. Verifica tu conexión e intenta nuevamente.');
      return [];
    }
    
    // Sort by publication date (newest first), then by relevance
    allArticles.sort((a, b) => {
      const dateA = new Date(a.published_at);
      const dateB = new Date(b.published_at);
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      return (b.relevance || 0) - (a.relevance || 0);
    });
    
    console.log(`✓ Feed cargado: ${allArticles.length} artículos únicos de ${foundData ? 'datos reales' : 'fallback'}`);
    return allArticles;
  }
  
  function showLoadingState(message) {
    const list = state.els.list;
    if (!list) return;
    
    list.innerHTML = `
      <div class="panel" style="text-align:center; padding:32px; color:var(--muted)">
        <div style="font-size:18px; margin-bottom:8px">⏳</div>
        <div>${message}</div>
      </div>
    `;
  }
  
  function hideLoadingState() {
    // Loading state will be replaced by render()
  }
  
  function showErrorState(message) {
    const list = state.els.list;
    if (!list) return;
    
    list.innerHTML = `
      <div class="panel" style="text-align:center; padding:32px; background:var(--panel-alt); border-color:var(--err)">
        <div style="font-size:18px; margin-bottom:8px; color:var(--err)">⚠️</div>
        <div style="color:var(--text); margin-bottom:12px">${message}</div>
        <button onclick="location.reload()" class="btn">Reintentar</button>
      </div>
    `;
  }

  function buildFacets(items){
    const s = (arr, key) => Array.from(new Set(arr.map(x => (x[key] || '').toString().trim()))).filter(Boolean).sort();
    const topics = Array.from(new Set(items.flatMap(x => x.topics || []))).sort();
    const countries = s(items, 'country');
    const sources = s(items, 'source');
    const languages = s(items, 'language');
    state.facets = { countries, topics, sources, languages };
    // counts for smart tags
    const cMap = new Map();
    const tMap = new Map();
    for (const it of items){
      const c = (it.country||'').toString(); if(c){ cMap.set(c, (cMap.get(c)||0)+1); }
      for (const t of (it.topics||[])){ if(t){ tMap.set(t, (tMap.get(t)||0)+1); } }
    }
    state.counts = { countries: cMap, topics: tMap };
  }

  function populateFilters(){
    const country = state.els.country;
    const topic = state.els.topic;
    const source = state.els.source;
    country.innerHTML = `<option value="todos">Todos los países</option>` + state.facets.countries.map(c=>`<option>${c}</option>`).join('');
    topic.innerHTML = `<option value="todos">Todos los temas</option>` + state.facets.topics.map(t=>`<option>${t}</option>`).join('');
    source.innerHTML = `<option value="todas">Todas las fuentes</option>` + state.facets.sources.map(s=>`<option>${s}</option>`).join('');
  }

  function applyFilters(){
    const q = state.filters.q.trim().toLowerCase();
    let arr = state.all.filter(a => (
      (state.filters.country==='todos' || a.country===state.filters.country) &&
      (state.filters.topic==='todos' || (a.topics||[]).includes(state.filters.topic)) &&
      (state.filters.source==='todas' || a.source===state.filters.source) &&
      (q==='' || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q))
    ));
    if (state.filters.sort==='recent'){
      arr.sort((x,y)=> new Date(y.published_at) - new Date(x.published_at));
    } else {
      arr.sort((x,y)=> (y.relevance||0) - (x.relevance||0));
    }
    state.filtered = arr;
  }

  function renderMetrics(){
    const mA = $('#metric-articles'); if(mA) mA.textContent = state.all.length.toString();
    const mS = $('#metric-sources'); if(mS) mS.textContent = state.facets.sources.length.toString();
    const mC = $('#metric-countries'); if(mC) mC.textContent = state.facets.countries.length.toString();
    const mT = $('#metric-topics'); if(mT) mT.textContent = state.facets.topics.length.toString();
  }

  function render(){
    const list = state.els.list;
    if(!list) return;
    
    // Update results counter
    updateResultsCounter();
    
    list.innerHTML = '';
    if(state.filtered.length===0){
      const empty = create('div','panel');
      empty.style.textAlign = 'center';
      empty.style.padding = '32px 16px';
      empty.innerHTML = `
        <div style="font-size:18px; margin-bottom:8px">📰</div>
        <div>No se encontraron artículos con los filtros actuales</div>
        <div style="font-size:13px; margin-top:8px; color:var(--muted)">Prueba ajustando los filtros o <a href="#" onclick="clearAllFilters(); return false;" style="color:var(--brand)">limpiar todos</a></div>
      `;
      list.appendChild(empty);
      return;
    }
    
    const isHomePage = window.location.pathname === '/' || window.location.pathname.includes('index.html');
    const maxResults = isHomePage ? 12 : 48;
    const take = Math.min(maxResults, state.filtered.length);
    
    for(let i=0;i<take;i++){
      list.appendChild(card(state.filtered[i]));
    }
    
    // Show "load more" hint if there are more results (only on non-home pages)
    if (!isHomePage && state.filtered.length > maxResults) {
      const loadMore = create('div', 'panel');
      loadMore.style.textAlign = 'center';
      loadMore.style.marginTop = '16px';
      loadMore.style.color = 'var(--muted)';
      loadMore.style.fontSize = '13px';
      loadMore.textContent = `Mostrando ${take} de ${state.filtered.length} artículos`;
      list.parentNode.appendChild(loadMore);
    }
  }
  
  function updateResultsCounter(){
    const counter = document.getElementById('results-counter');
    if (!counter) return;
    
    const total = state.all.length;
    const showing = state.filtered.length;
    const hasFilters = state.filters.q || state.filters.country !== 'todos' || state.filters.topic !== 'todos' || state.filters.source !== 'todas';
    
    if (hasFilters) {
      counter.textContent = `${showing} de ${total} artículos`;
      counter.style.opacity = '1';
    } else {
      counter.textContent = `${total} artículos`;
      counter.style.opacity = '0.7';
    }
  }
  
  window.clearAllFilters = function() {
    state.filters = { country: 'todos', topic: 'todos', source: 'todas', q: '', sort: 'recent' };
    
    // Update form elements
    if (state.els.search) state.els.search.value = '';
    if (state.els.country) state.els.country.value = 'todos';
    if (state.els.topic) state.els.topic.value = 'todos'; 
    if (state.els.source) state.els.source.value = 'todas';
    if (state.els.sort) state.els.sort.value = 'recent';
    
    applyFilters();
    render();
    updateSmartTagActives();
  };

  function qp(params){
    const p = new URLSearchParams(params);
    return `/pages/noticias.html?${p.toString()}`;
  }

  function icon(id){
    const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.setAttribute('class','icon');
    s.setAttribute('aria-hidden','true');
    const u = document.createElementNS('http://www.w3.org/2000/svg','use');
    u.setAttributeNS('http://www.w3.org/1999/xlink','href',`/assets/icons.svg#${id}`);
    s.appendChild(u);
    return s;
  }

  function card(a){
    const el = create('article','card');
    const body = create('div','body');
    const title = create('h3','title');
    const link = create('a'); 
    link.href = a.url.startsWith('/') ? a.url : a.url; 
    if (!a.url.startsWith('/')) {
      link.target = '_blank'; 
      link.rel = 'noopener';
    }
    link.textContent = a.title; 
    title.appendChild(link);
    // NEW badge if newer than last visit
    try{
      const lv = Number(localStorage.getItem('lastVisit')||0);
      const ts = new Date(a.published_at).getTime();
      if (lv && ts > lv){
        const newChip = create('span','chip new'); newChip.textContent = 'Nuevo';
        title.appendChild(document.createTextNode(' '));
        title.appendChild(newChip);
      }
    }catch(_){ /* noop */ }
    
    const summary = create('p'); 
    summary.textContent = a.summary || '';

    // Primera fila de metadata: país y temas principales
    const topicChips = create('div','meta');
    
    // País con estilo temático
    const countrySlug = slugify(a.country);
    const countryChip = create('span',`chip tag-country-${countrySlug}`);
    const cLink = create('a'); 
    cLink.href = qp({pais:a.country}); 
    cLink.textContent = a.country; 
    countryChip.appendChild(cLink); 
    topicChips.appendChild(countryChip);

    // Mostrar hasta 2 temas principales con colores temáticos
    const topics = (a.topics || []).slice(0, 2);
    for (const topic of topics) {
      const topicSlug = slugify(topic);
      const topicChip = create('span',`chip tag-topic-${topicSlug}`);
      const tLink = create('a'); 
      tLink.href = qp({tema:topic}); 
      tLink.textContent = topic; 
      topicChip.appendChild(tLink);
      topicChips.appendChild(topicChip);
    }

    // Segunda fila de metadata: fecha, fuente, curador, traza JSON
    const metaData = create('div','meta');
    
    // Fecha
    const mDate = create('span','chip meta-date'); 
    mDate.append(icon('calendar'), document.createTextNode(' ' + fmtDate(a.published_at)));
    metaData.appendChild(mDate);

    // Fuente si existe
    if (a.source && a.source !== '—') {
      const mSource = create('span','chip'); 
      mSource.append(icon('source'), document.createTextNode(' ' + a.source));
      metaData.appendChild(mSource);
    }

    // Autor si existe y es diferente al curador
    if (a.author && a.author !== a.curator) {
      const mAuthor = create('span','chip'); 
      mAuthor.append(icon('user'), document.createTextNode(' ' + a.author));
      metaData.appendChild(mAuthor);
    }

    // Curador con estilo distintivo
    const curatorClass = getCuratorClass(a.curator);
    const mCurator = create('span',`chip meta-curator ${curatorClass}`); 
    mCurator.append(icon('robot'), document.createTextNode(' ' + (a.curator || 'Luciano AI')));
    metaData.appendChild(mCurator);

    // Indicador de sentimiento si no es neutral
    if (a.sentiment && a.sentiment !== 'neutral') {
      const sentIcon = a.sentiment === 'positive' ? 'trending-up' : 'trending-down';
      const sentClass = a.sentiment === 'positive' ? 'ok' : 'warn';
      const mSent = create('span',`chip ${sentClass}`);
      mSent.append(icon(sentIcon));
      mSent.title = `Sentimiento: ${a.sentiment}`;
      metaData.appendChild(mSent);
    }

    // Enlace a archivo JSON de la entrada (trazabilidad)
    try{
      const dateStr = (a.published_at || new Date().toISOString()).slice(0,10);
      const slug = slugify(a.title);
      const uniq = shortHash(a.url || a.id || (a.title||''));
      const entryHref = `/data/entries/${dateStr}/${slug}-${uniq}.json`;
      const mJson = create('a','chip');
      mJson.href = entryHref; mJson.target = '_blank'; mJson.rel = 'noopener';
      mJson.title = 'Ver archivo JSON (trazabilidad)';
      mJson.textContent = 'JSON';
      metaData.appendChild(mJson);
    }catch(_){ /* optional */ }

    body.append(title, summary, topicChips, metaData);
    el.append(body);
    return el;
  }

  // Función para obtener clase CSS del curador
  function getCuratorClass(curator) {
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

  function readQuery(){
    const p = new URLSearchParams(location.search);
    state.filters.q = p.get('q') || '';
    state.filters.country = p.get('pais') || 'todos';
    state.filters.topic = p.get('tema') || 'todos';
    state.filters.source = p.get('fuente') || 'todas';
    state.filters.sort = p.get('orden') || 'recent';
  }

  function bind(){
    const { search, country, topic, source, sort } = state.els;
    const update = () => { applyFilters(); render(); };
    search.addEventListener('input', (e)=>{ state.filters.q = e.target.value; update(); });
    country.addEventListener('change', (e)=>{ state.filters.country = e.target.value; update(); updateSmartTagActives(); });
    topic.addEventListener('change', (e)=>{ state.filters.topic = e.target.value; update(); updateSmartTagActives(); });
    source.addEventListener('change', (e)=>{ state.filters.source = e.target.value; update(); });
    sort.addEventListener('change', (e)=>{ state.filters.sort = e.target.value; update(); });
  }

  function renderSmartTags(){
    const filtersBox = document.getElementById('filters');
    if(!filtersBox) return;
    // Remove existing smart-tags sibling (if any)
    const sib = filtersBox.nextElementSibling;
    if (sib && sib.classList && sib.classList.contains('smart-tags')) sib.remove();
    const row = create('div','smart-tags');
    const label = create('span','label'); label.textContent = 'Explorar rápido:'; row.appendChild(label);
    const topC = Array.from(state.counts?.countries?.entries?.() || []).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);
    const topT = Array.from(state.counts?.topics?.entries?.() || []).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);
    const gC = create('div','group');
    for (const c of topC){
      const a = create('a','chip brand'); a.href = qp({pais:c}); a.textContent = c; a.setAttribute('data-pais', c); gC.appendChild(a);
    }
    row.appendChild(gC);
    const sep = create('span','sep'); row.appendChild(sep);
    const gT = create('div','group');
    for (const t of topT){
      const isCrypto = /^crypto$/i.test(t) || /^cripto$/i.test(t);
      const a = create('a', 'chip ' + (isCrypto ? 'crypto' : 'brand'));
      a.href = qp({tema:t}); a.textContent = t; a.setAttribute('data-tema', t); gT.appendChild(a);
    }
    row.appendChild(gT);
    const reset = create('a','chip'); reset.href = qp({}); reset.textContent = 'Limpiar filtros'; reset.setAttribute('data-reset','1'); row.appendChild(reset);
    filtersBox.parentNode.insertBefore(row, filtersBox.nextSibling);
    updateSmartTagActives();
  }

  function updateSmartTagActives(){
    const row = document.querySelector('.smart-tags'); if(!row) return;
    row.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
    if (state.filters.country && state.filters.country !== 'todos'){
      const el = row.querySelector(`.chip[data-pais="${CSS.escape(state.filters.country)}"]`);
      if (el) el.classList.add('active');
    }
    if (state.filters.topic && state.filters.topic !== 'todos'){
      const el = row.querySelector(`.chip[data-tema="${CSS.escape(state.filters.topic)}"]`);
      if (el) el.classList.add('active');
    }
  }

  async function initFeed(){
    const list = document.getElementById('news-list');
    if(!list) return; // Not on this page

    state.els = {
      list,
      search: document.getElementById('search'),
      country: document.getElementById('filter-country'),
      topic: document.getElementById('filter-topic'),
      source: document.getElementById('filter-source'),
      sort: document.getElementById('sort-by')
    };

    readQuery();
    // Defaults from dataset (per-page): data-default-topic/country/source/sort
    try{
      const ds = list.dataset || {};
      if (state.filters.topic==='todos' && ds.defaultTopic){ state.filters.topic = ds.defaultTopic; }
      if (state.filters.country==='todos' && ds.defaultCountry){ state.filters.country = ds.defaultCountry; }
      if (state.filters.source==='todas' && ds.defaultSource){ state.filters.source = ds.defaultSource; }
      if (ds.defaultSort && (ds.defaultSort==='recent' || ds.defaultSort==='relevance')){ state.filters.sort = ds.defaultSort; }
    }catch(_){ /* noop */ }
    try {
      state.all = await loadFeed();
      // Compute new items since last visit
      try{
        const lv = Number(localStorage.getItem('lastVisit')||0);
        if (lv){
          state.newSince = state.all.filter(a => new Date(a.published_at).getTime() > lv).length;
        } else { state.newSince = 0; }
      }catch(_){ state.newSince = 0; }
      
      if (state.all.length === 0) {
        showErrorState('No hay noticias disponibles en este momento.');
        return;
      }
      
      buildFacets(state.all);
      populateFilters();
      renderLastVisitedBanner();
      renderSmartTags();
      
      // seed UI elements safely
      if (state.els.search) state.els.search.value = state.filters.q;
      if (state.els.country) state.els.country.value = state.filters.country;
      if (state.els.topic) state.els.topic.value = state.filters.topic;
      if (state.els.source) state.els.source.value = state.filters.source;
      if (state.els.sort) state.els.sort.value = state.filters.sort;
      
      applyFilters();
      render();
      renderMetrics();
      bind();
      updateSmartTagActives();
      
    } catch (e){
      console.error('Error inicializando feed:', e);
      showErrorState('Error al cargar las noticias. Verifica tu conexión e intenta nuevamente.');
    }
  }

  function renderLastVisitedBanner(){
    const filtersBox = document.getElementById('filters');
    if (!filtersBox) return;
    // Remove existing banner
    const sib = filtersBox.previousElementSibling;
    if (sib && sib.classList && sib.classList.contains('last-visit')) sib.remove();
    const bar = create('div','last-visit');
    const lv = Number(localStorage.getItem('lastVisit')||0);
    if (state.newSince > 0){
      bar.innerHTML = `<span class="chip ok">${state.newSince} nuevos desde tu última visita</span> <button class="btn subtle" id="mark-seen">Marcar como visto</button>`;
      bar.querySelector('#mark-seen').onclick = () => {
        localStorage.setItem('lastVisit', String(Date.now()));
        bar.remove();
        applyFilters();
        render();
      };
      filtersBox.parentNode.insertBefore(bar, filtersBox);
    } else if (!lv) {
      // First visit message
      bar.innerHTML = `<span class="note">Bienvenido. Las nuevas historias aparecerán resaltadas.</span>`;
      filtersBox.parentNode.insertBefore(bar, filtersBox);
    }
  }

  // Observatorio Legal (destacados):
  // Si existe #regulatory-highlights en la página, filtra 6 ítems por temas [Regulación, Gobierno, Ética]
  async function initRegHighlights(){
    const container = document.getElementById('regulatory-highlights');
    if(!container) return;
    try{
      const all = await loadFeed();
      const topics = new Set(['Regulación','Gobierno','Política pública','Ética']);
      const items = all.filter(a => (a.topics||[]).some(t => topics.has(t)) )
                       .sort((x,y)=> new Date(y.published_at) - new Date(x.published_at))
                       .slice(0,6);
      container.innerHTML='';
      if(items.length===0){
        const empty = document.createElement('div');
        empty.className='note';
        empty.textContent='No hay señales recientes. Revisa el Observatorio Legal.';
        container.appendChild(empty);
        return;
      }
      for(const a of items){ container.appendChild(card(a)); }
    }catch(e){
      container.innerHTML='<div class="panel">No se pudo cargar destacados regulatorios.</div>';
    }
  }

  // Inyección de items (desde búsqueda en tiempo real u otras fuentes controladas)
  function addItems(rawItems){
    const items = (rawItems||[]).map(normalize);
    // Deduplicar por url o id
    const seen = new Set(state.all.map(x => x.url || x.id));
    for (const it of items){
      const key = it.url || it.id;
      if (key && !seen.has(key)){
        state.all.unshift(it);
        seen.add(key);
      }
    }
    buildFacets(state.all);
    populateFilters();
    renderSmartTags();
    applyFilters();
    render();
    renderMetrics();
    updateSmartTagActives();
  }

  window.AILatamFeed = { initFeed, initRegHighlights, addItems };
})();
