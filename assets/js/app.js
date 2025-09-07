/*
  app.js — Inicializador por página
  - Detecta componentes por ID y carga módulos ligeros.
  - Mantener puro y defensivo: no asume presencia de elementos.
  - Agentes: añadir inicializaciones nuevas aquí con comprobación de existencia.
*/
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav){
    toggle.addEventListener('click', () => {
      const isOpen = nav.style.display === 'flex';
      nav.style.display = isOpen ? 'none' : 'flex';
    });
  }

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
});

async function initSources(container){
  const url = (window.AILatamConfig?.api?.sourcesUrl) || '/data/sources.json';
  const res = await fetch(url, { cache:'no-store' });
  const data = await res.json();
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
      li.innerHTML = `<a href="${s.url}" target="_blank" rel="noopener">${s.nombre}</a> <span class="muted">(${s.pais || 'Regional'})</span>`;
      ul.appendChild(li);
    }
    section.appendChild(ul);
    container.appendChild(section);
  }
}

async function initAgents(table){
  const url = (window.AILatamConfig?.api?.agentsUrl) || '/data/agents.json';
  const res = await fetch(url, { cache:'no-store' });
  const agents = await res.json();
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';
  for (const a of agents){
    const tr = document.createElement('tr');
    const st = (a.estado || 'desconocido').toLowerCase();
    const statusChip = `<span class="chip ${st==='activo'?'ok':st==='fallo'?'err':st==='pausado'?'warn':''}">${a.estado}</span>`;
    const last = a.ultimo_ejecucion || a.lastRun || '';
    tr.innerHTML = `
      <td>${a.nombre}</td>
      <td>${statusChip}</td>
      <td>${last ? new Date(last).toLocaleString('es-ES') : '—'}</td>
      <td>${a.throughput ? a.throughput + '/h' : '—'}</td>
      <td class="muted">${a.notas || ''}</td>
    `;
    tbody.appendChild(tr);
  }
}

// Panorama: carga categorías, descripciones y propuestas de automatización
async function initPanorama(container){
  const url = (window.AILatamConfig?.api?.panoramaUrl) || '/data/panorama.json';
  const res = await fetch(url, { cache:'no-store' });
  const cats = await res.json();
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
  const url = (window.AILatamConfig?.api?.legalUrl) || '/data/legal-sample.json';
  const res = await fetch(url, { cache:'no-store' });
  const items = await res.json();
  container.innerHTML='';
  for (const it of items){
    const box = document.createElement('div');
    box.className='timeline-item';
    const d = it.fecha ? new Date(it.fecha).toLocaleDateString('es-ES') : '';
    box.innerHTML = `
      <div class="head">
        <span class="tag">${it.pais}</span>
        <span class="tag">${it.estado}</span>
        <span class="item" style="margin-left:auto; display:inline-flex; align-items:center; gap:6px">
          <svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#calendar"></use></svg>${d}
        </span>
      </div>
      <h4 class="title">${it.titulo}</h4>
      <p>${it.resumen||''}</p>
      <div class="meta"><a href="${it.url}" target="_blank" rel="noopener"><svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#link"></use></svg> Fuente oficial</a></div>
    `;
    container.appendChild(box);
  }
}
