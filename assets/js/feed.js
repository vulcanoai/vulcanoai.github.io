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
    facets: { countries: [], topics: [], sources: [], languages: [] },
    filters: { country: 'todos', topic: 'todos', source: 'todas', q: '', sort: 'recent' },
    els: {}
  };

  function $(sel){ return document.querySelector(sel); }
  function create(el, cls){ const n=document.createElement(el); if(cls) n.className=cls; return n; }

  const fmtDate = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const diff = (Date.now() - d.getTime())/1000;
    if (diff < 60) return 'hace segundos';
    if (diff < 3600) return `hace ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff/3600)} h`;
    return d.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
  };

  const normalize = (a) => ({
    id: a.id || crypto.randomUUID(),
    title: a.title || a.titulo || 'Sin título',
    summary: a.summary || a.resumen || '',
    url: a.url || a.link || '#',
    source: a.source || a.fuente || '—',
    source_url: a.source_url || a.fuente_url || '',
    country: a.country || a.pais || 'Regional',
    topics: a.topics || a.temas || [],
    language: a.language || a.idioma || 'es',
    published_at: a.published_at || a.fecha || new Date().toISOString(),
    // image_url intencionalmente ignorado para UI mínima sin imágenes
    relevance: a.relevance || a.relevancia || 0,
    sentiment: a.sentiment || a.sentimiento || 'neutral',
    author: a.author || a.autor || '',
    curator: a.curator || a.curador || 'Agente IA'
  });

  async function fetchJSON(url){
    const res = await fetch(url, { cache:'no-store' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function loadFeed(){
    const url = cfg().feedUrl || '/data/sample-feed.json';
    try {
      // TODO(automation): soportar compresión (gzip/br) y ETag/If-None-Match
      const raw = await fetchJSON(url);
      return (Array.isArray(raw) ? raw : (raw.items || raw.articles || [])).map(normalize);
    } catch (e){
      console.warn('Fallo al cargar feed, usando muestra:', e);
      const raw = await fetchJSON('/data/sample-feed.json');
      return raw.map(normalize);
    }
  }

  function buildFacets(items){
    const s = (arr, key) => Array.from(new Set(arr.map(x => (x[key] || '').toString()))).filter(Boolean).sort();
    const topics = Array.from(new Set(items.flatMap(x => x.topics || []))).sort();
    const countries = s(items, 'country');
    const sources = s(items, 'source');
    const languages = s(items, 'language');
    state.facets = { countries, topics, sources, languages };
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
    list.innerHTML = '';
    if(state.filtered.length===0){
      const empty = create('div','panel');
      empty.textContent = 'Sin resultados. Ajusta filtros o búsqueda.';
      list.appendChild(empty);
      return;
    }
    // NOTE: home muestra tope 12; páginas dedicadas pueden listar todo
    const take = Math.min(12, state.filtered.length);
    for(let i=0;i<take;i++){
      list.appendChild(card(state.filtered[i]));
    }
  }

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
    const link = create('a'); link.href=a.url; link.target='_blank'; link.rel='noopener'; link.textContent=a.title; title.appendChild(link);
    const summary = create('p'); summary.textContent = a.summary || '';

    // Chips enlazables
    const chips = create('div','meta');
    const countryChip = create('span','chip');
    const cLink = create('a'); cLink.href = qp({pais:a.country}); cLink.textContent = a.country; countryChip.appendChild(cLink); chips.appendChild(countryChip);
    for(const t of (a.topics||[]).slice(0,2)){
      const c = create('span','chip'); const aLink = create('a'); aLink.href = qp({tema:t}); aLink.textContent = t; c.appendChild(aLink); chips.appendChild(c);
    }

    // Meta compacta con iconos
    const meta = create('div','meta');
    const mDate = create('span','item'); mDate.append(icon('calendar'), document.createTextNode(fmtDate(a.published_at)));
    const mSource = create('span','item'); const srcA = create('a'); srcA.href = qp({fuente:a.source}); srcA.textContent = a.source; mSource.append(icon('source'), srcA);
    const mAuthor = create('span','item'); mAuthor.append(icon('user'), document.createTextNode(a.author || '—'));
    const mCur = create('span','item'); mCur.append(icon('robot'), document.createTextNode(a.curator));
    meta.append(mDate, mSource, mAuthor, mCur);

    body.append(title, summary, chips, meta);
    el.append(body);
    return el;
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
    country.addEventListener('change', (e)=>{ state.filters.country = e.target.value; update(); });
    topic.addEventListener('change', (e)=>{ state.filters.topic = e.target.value; update(); });
    source.addEventListener('change', (e)=>{ state.filters.source = e.target.value; update(); });
    sort.addEventListener('change', (e)=>{ state.filters.sort = e.target.value; update(); });
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
    try {
      state.all = await loadFeed();
      buildFacets(state.all);
      populateFilters();
      // seed UI
      state.els.search.value = state.filters.q;
      state.els.country.value = state.filters.country;
      state.els.topic.value = state.filters.topic;
      state.els.source.value = state.filters.source;
      state.els.sort.value = state.filters.sort;
      applyFilters();
      render();
      renderMetrics();
      bind();
    } catch (e){
      list.innerHTML = '<div class="panel">No se pudo cargar el feed.</div>';
      console.error(e);
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

  window.AILatamFeed = { initFeed, initRegHighlights };
})();
