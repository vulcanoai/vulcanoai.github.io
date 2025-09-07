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

  // Initialize sources page if present
  const sourcesList = document.getElementById('sources-list');
  if (sourcesList){ initSources(sourcesList).catch(console.error); }

  // Initialize agents page if present
  const agentsTable = document.getElementById('agents-table');
  if (agentsTable){ initAgents(agentsTable).catch(console.error); }
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

