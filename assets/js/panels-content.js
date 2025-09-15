/*
  panels-content.js — Lightweight dynamic content for overlay panels
  - Listens to 'vulcano:panel-open' events (emitted by panels.js)
  - Populates Agents, Analytics, Sources, Markets, Support panels on demand
  - Zero external deps; fetches from /data endpoints; graceful empty states
*/
(function(){
  function $(sel, root){ return (root||document).querySelector(sel); }
  async function loadJSON(url){ try{ const r = await fetch(url, { cache:'no-store' }); if(!r.ok) return null; return await r.json(); }catch(_){ return null; } }
  function timeAgo(iso){ try{ const d=new Date(iso); const s=Math.floor((Date.now()-d.getTime())/1000); if(s<60) return 'hace segundos'; if(s<3600) return `hace ${Math.floor(s/60)} min`; if(s<86400) return `hace ${Math.floor(s/3600)} h`; return d.toLocaleDateString('es-ES'); }catch(_){ return '—'; } }

  function setContent(overlay, html){ const box = $('.panel-content', overlay); if (box) box.innerHTML = html; }
  function chip(text, cls){ return `<span class="chip ${cls||''}">${escapeHtml(text)}</span>`; }
  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

  async function openAgents(overlay){
    setContent(overlay, '<div class="panel">Cargando estado de agentes…</div>');
    const [agents, status] = await Promise.all([
      loadJSON('/data/agents.json'),
      loadJSON('/data/index/status.json')
    ]);
    const list = Array.isArray(agents) ? agents : [];
    const last = status?.last_feed_update || status?.last_run_iso || status?.generated_at;
    const ok = status?.ok === true || (status?.feed_count||0) > 0;
    const total = list.length;

    const rows = list.map(a => `
      <div class="meta" style="gap:8px; align-items:center">
        ${chip(a.nombre || 'Agente', 'brand')}<span class="sep">•</span>
        ${chip(a.estado || '—', (String(a.estado||'').toLowerCase().includes('activo')?'ok':''))}
        ${a.notas? `<span class="note">${escapeHtml(a.notas)}</span>`: ''}
      </div>
    `).join('');

    setContent(overlay, `
      <div class="panel">
        <div class="panel-head">
          <h3>Agentes activos</h3>
          <span class="chip ${ok?'ok':'warn'}">${ok?'OK':'En espera'}</span>
        </div>
        <div class="meta" style="margin-bottom:8px">
          ${chip(`${total} agentes`, 'brand')}
          <span class="sep">•</span>
          <span class="note">Actualización: ${escapeHtml(timeAgo(last))}</span>
        </div>
        ${rows || '<div class="note">Sin detalles de agentes.</div>'}
        <div class="meta" style="margin-top:12px">
          <a class="chip" href="/pages/agentes.html">Ver tablero completo</a>
        </div>
      </div>
    `);
  }

  async function openAnalytics(overlay){
    setContent(overlay, '<div class="panel">Cargando análisis…</div>');
    const [byTopic, byCountry, status] = await Promise.all([
      loadJSON('/data/index/by-topic.json'),
      loadJSON('/data/index/by-country.json'),
      loadJSON('/data/index/status.json')
    ]);
    const topTopics = Object.entries((byTopic||{})).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const topCountries = Object.entries((byCountry||{})).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const total = status?.feed_count || 0;
    setContent(overlay, `
      <div class="panel">
        <div class="panel-head"><h3>Señales por tema</h3><span class="muted">Top 10</span></div>
        <div class="smart-tags">${topTopics.map(([t,n])=>`<a class="chip" href="/pages/noticias.html?tema=${encodeURIComponent(t)}">${escapeHtml(t)} (${n})</a>`).join('') || '<span class="note">No hay datos</span>'}</div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Señales por país</h3><span class="muted">Top 10</span></div>
        <div class="smart-tags">${topCountries.map(([c,n])=>`<a class="chip" href="/pages/noticias.html?pais=${encodeURIComponent(c)}">${escapeHtml(c)} (${n})</a>`).join('') || '<span class="note">No hay datos</span>'}</div>
      </div>
      <div class="meta"><span class="note">Total artículos indexados: ${total}</span></div>
    `);
  }

  async function openSources(overlay){
    setContent(overlay, '<div class="panel">Cargando fuentes…</div>');
    const raw = await loadJSON('/data/feed-latest.json');
    const articles = Array.isArray(raw) ? raw : (raw?.articles || raw?.items || []);
    const map = new Map();
    for (const a of articles){ const s = (a.source||'').trim(); if(!s) continue; map.set(s, (map.get(s)||0)+1); }
    const entries = Array.from(map.entries()).sort((a,b)=>b[1]-a[1]);
    setContent(overlay, `
      <div class="panel">
        <div class="panel-head"><h3>Fuentes activas</h3><span class="muted">${entries.length}</span></div>
        <div class="smart-tags">${entries.slice(0,18).map(([s,n])=>`<a class="chip" href="/pages/noticias.html?fuente=${encodeURIComponent(s)}">${escapeHtml(s)} (${n})</a>`).join('') || '<span class="note">Aún no hay fuentes publicadas.</span>'}</div>
        <div class="meta" style="margin-top:8px"><a class="chip" href="/pages/fuentes.html">Ver página de fuentes</a></div>
      </div>
    `);
  }

  async function openMarkets(overlay){
    setContent(overlay, '<div class="panel">Cargando señales de mercado…</div>');
    const raw = await loadJSON('/data/feed-latest.json');
    const arr = Array.isArray(raw) ? raw : (raw?.articles || raw?.items || []);
    const kw = ['crypto','cripto','blockchain','bitcoin','ethereum','defi'];
    const items = arr.filter(a=>{
      const t = `${a.title||''} ${a.summary||''} ${(a.topics||[]).join(' ')}`.toLowerCase();
      return kw.some(k=>t.includes(k));
    });
    const countries = new Set(items.map(x => (x.country||'').trim()).filter(Boolean));
    const sources = new Set(items.map(x => (x.source||'').trim()).filter(Boolean));
    setContent(overlay, `
      <div class="panel">
        <div class="panel-head"><h3>Crypto LATAM</h3><span class="muted">Señales recientes</span></div>
        <div class="meta" style="gap:8px">
          ${chip(`${items.length} señales`, 'brand')} ${chip(`${countries.size} países`)} ${chip(`${sources.size} fuentes`)}
        </div>
        <div class="meta" style="margin-top:8px">
          <a class="chip brand" href="/pages/noticias.html?tema=Crypto">Ver noticias Crypto</a>
          <a class="chip" href="/pages/crypto.html">Abrir vista de Crypto</a>
        </div>
      </div>
    `);
  }

  async function openSupport(overlay){
    setContent(overlay, '<div class="panel">Preparando opciones…</div>');
    const status = await loadJSON('/data/index/status.json');
    let wa = '#';
    try { wa = typeof getWhatsAppHref==='function' ? getWhatsAppHref('diarias') : (window.AILatamConfig?.social?.whatsappLink || '#'); } catch(_){ /* noop */ }
    const total = status?.feed_count || 0;
    setContent(overlay, `
      <div class="panel">
        <div class="panel-head"><h3>Apoya la investigación independiente</h3></div>
        <p>Si este proyecto te sirve, puedes ayudarnos a mantenerlo abierto y sostenible.</p>
        <div class="smart-tags" style="margin:8px 0">
          <a class="chip brand" href="/pages/apoya.html">Ver formas de apoyar</a>
          <a class="chip" target="_blank" rel="noopener" href="${escapeHtml(wa)}">Recibir actualizaciones (WhatsApp)</a>
        </div>
        <div class="note">Artículos procesados (último ciclo): ${total}</div>
      </div>
    `);
  }

  document.addEventListener('vulcano:panel-open', (e)=>{
    const id = e?.detail?.id; const el = e?.detail?.element;
    if (!id || !el) return;
    if (id === 'agents') return openAgents(el);
    if (id === 'analytics') return openAnalytics(el);
    if (id === 'sources') return openSources(el);
    if (id === 'markets') return openMarkets(el);
    if (id === 'support') return openSupport(el);
  });
})();

