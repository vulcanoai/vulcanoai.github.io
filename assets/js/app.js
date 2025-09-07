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

  // Indie submission form if present
  const indie = document.getElementById('indie-form');
  if (indie){ initIndieForm(indie).catch(console.error); }
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
  const url = (window.AILatamConfig?.api?.agentsUrl) || '/data/agents.json';
  const res = await fetch(url, { cache:'no-store' });
  const agents = await res.json();
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
    const head = document.createElement('div'); head.className='head';
    const tagPais = document.createElement('span'); tagPais.className='tag'; tagPais.textContent = it.pais || '';
    const tagEstado = document.createElement('span'); tagEstado.className='tag'; tagEstado.textContent = it.estado || '';
    const dateItem = document.createElement('span'); dateItem.className='item'; dateItem.style.marginLeft='auto'; dateItem.style.display='inline-flex'; dateItem.style.alignItems='center'; dateItem.style.gap='6px';
    const cal = document.createElementNS('http://www.w3.org/2000/svg','svg'); cal.setAttribute('class','icon'); cal.setAttribute('aria-hidden','true'); const use = document.createElementNS('http://www.w3.org/2000/svg','use'); use.setAttributeNS('http://www.w3.org/1999/xlink','href','/assets/icons.svg#calendar'); cal.appendChild(use);
    const d = it.fecha ? new Date(it.fecha).toLocaleDateString('es-ES') : '';
    dateItem.append(cal, document.createTextNode(d));
    head.append(tagPais, tagEstado, dateItem);

    const h4 = document.createElement('h4'); h4.className='title'; h4.textContent = it.titulo || '';
    const p = document.createElement('p'); p.textContent = it.resumen || '';
    const meta = document.createElement('div'); meta.className='meta';
    const a = document.createElement('a'); a.href = it.url || '#'; a.target = '_blank'; a.rel = 'noopener';
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
