/*
  logo.js — Generador del logo esférico (wireframe)
  Objetivo: que el logo sea reproducible por código en cualquier visualización vectorial.

  Firma (signature) del logo Vulcano Ai:
  - R = 140 (base), latitudes = 6 visibles, longitudes = 12
  - Rotaciones: 0°, 30°, 60° sobre el centro
  - Trazo: #ff5a2a, opacidad 0.85, grosor escalable

  El generador usa parámetros determinísticos. Cambiarlos cambia la firma.
*/
(function(){
  const SIG = {
    radius: 140,
    lats: 6,
    lons: 12,
    rotations: [0, 30, 60],
    stroke: '#ff5a2a'
  };

  function createNS(tag){ return document.createElementNS('http://www.w3.org/2000/svg', tag); }

  function drawWireSphere(el, opts={}){
    const cfg = Object.assign({}, SIG, opts);
    const size = (cfg.radius*2)+10;
    const svg = createNS('svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);

    const g = createNS('g');
    g.setAttribute('transform', `translate(${size/2},${size/2})`);

    const circle = createNS('circle');
    circle.setAttribute('r', cfg.radius);
    circle.setAttribute('class','stroke');
    g.appendChild(circle);

    // Latitudes (horizontales): elipses con rx=R y ry variando por seno
    for(let i=1;i<=cfg.lats;i++){
      const ry = Math.max(2, cfg.radius * Math.sin((i*Math.PI)/(cfg.lats*2)));
      const e = createNS('ellipse');
      e.setAttribute('rx', cfg.radius);
      e.setAttribute('ry', ry);
      e.setAttribute('class','stroke');
      g.appendChild(e);
    }

    // Longitudes: duplicamos elipses verticales con varias rotaciones
    for(const rot of cfg.rotations){
      const sub = createNS('g');
      sub.setAttribute('transform', `rotate(${rot})`);
      sub.setAttribute('class','spin-slow');
      for(let i=0;i<cfg.lons;i++){
        const angle = (i * 180 / cfg.lons); // 0..180
        const ry = Math.max(6, cfg.radius * 0.25 + (cfg.radius*0.25*Math.sin(i*Math.PI/cfg.lons)));
        const e = createNS('ellipse');
        e.setAttribute('rx', cfg.radius);
        e.setAttribute('ry', ry);
        e.setAttribute('transform', `rotate(${angle})`);
        e.setAttribute('class','stroke');
        sub.appendChild(e);
      }
      g.appendChild(sub);
    }

    svg.appendChild(g);
    // estilo inline mínimo (por si faltara CSS)
    svg.style.fill = 'none';
    svg.style.stroke = 'var(--logo, '+cfg.stroke+')';
    svg.style.opacity = '0.9';
    svg.style.strokeWidth = '1.5';

    el.innerHTML = '';
    el.appendChild(svg);
  }

  function initHeroOrb(){
    const target = document.getElementById('hero-orb');
    if (!target) return;
    // tamaño responsivo
    const w = Math.min(420, target.clientWidth || 320);
    drawWireSphere(target, { radius: Math.max(80, Math.floor(w/2)-10) });
  }

  function initPageOrbs(){
    initHeroOrb();
    const v = document.getElementById('vulcano-orb');
    if (v){
      const w = Math.min(240, v.clientWidth || 120);
      drawWireSphere(v, { radius: Math.max(50, Math.floor(w/2)-6) });
    }
  }

  window.addEventListener('DOMContentLoaded', initPageOrbs);
  window.VulcanoLogo = { drawWireSphere, signature: SIG };
})();
