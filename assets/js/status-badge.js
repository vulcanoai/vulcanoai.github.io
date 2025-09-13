/*
  status-badge.js — lightweight data freshness badge
  - Looks for /data/index/status.json
  - If present, injects a small badge into an element with id 'status-badge'
    or appends to body bottom-right.
*/
(function(){
  async function fetchJSON(url){ try { const r=await fetch(url, {cache:'no-store'}); if(!r.ok) return null; return await r.json(); } catch { return null; } }
  function el(tag, cls){ const n=document.createElement(tag); if(cls) n.className=cls; return n; }
  function mount(container){
    const style = document.createElement('style');
    style.textContent = `
      .ai-badge { position: fixed; right: 12px; bottom: 12px; background: var(--panel, #111); color: var(--muted, #aaa); border: 1px solid var(--border,#333); border-radius: 8px; padding: 6px 10px; font: 12px/1.2 system-ui, sans-serif; opacity: .85; }
      .ai-badge.ok { color: #49c774; border-color: #49c77433; }
      .ai-badge.err { color: #e26d6d; border-color: #e26d6d33; }
      .ai-badge .dot { display:inline-block; width:6px; height:6px; border-radius:50%; margin-right:6px; background: currentColor; }
    `;
    document.head.appendChild(style);
    (container||document.body).appendChild(el('div'));
  }
  function renderStatus(s){
    const host = document.getElementById('status-badge') || document.body;
    const box = el('div','ai-badge '+(s.ok?'ok':'err'));
    const dot = el('span','dot');
    const last = s.last_run_iso ? new Date(s.last_run_iso).toLocaleString() : '—';
    box.appendChild(dot);
    box.appendChild(document.createTextNode(`Datos: ${s.feed_count||0} • Última corrida: ${last}`));
    if (host === document.body) box.style.position = 'fixed';
    document.body.appendChild(box);
  }
  (async () => {
    const status = await fetchJSON('/data/index/status.json');
    if (!status) return;
    mount();
    renderStatus(status);
  })();
})();

