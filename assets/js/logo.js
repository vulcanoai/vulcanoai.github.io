/*
  logo.js — Generador del logo esférico (wireframe)
  Objetivo: que el logo sea reproducible por código en cualquier visualización vectorial.

  Firma (signature) del logo Vulcano Ai:
  - R = 140 (base), latitudes = 0 (sin ejes horizontales estáticos), longitudes = 12
  - Rotaciones: 0°, 30°, 60° sobre el centro
  - Trazo: #ff5a2a, opacidad 0.85, grosor escalable

  El generador usa parámetros determinísticos. Cambiarlos cambia la firma.
*/
(function(){
  const SIG = {
    radius: 140,
    lats: 0,
    lons: 12,
    rotations: [0, 30, 60],
    stroke: '#ff5a2a'
  };

  function createNS(tag){ return document.createElementNS('http://www.w3.org/2000/svg', tag); }

  function drawWireSphere(el, opts={}){
    const cfg = Object.assign({}, SIG, opts);
    const size = Math.max(20, (cfg.radius*2)+10);
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

    // Latitudes desactivadas por diseño (evitar eje horizontal estático)
    if (cfg.lats && cfg.lats > 0){
      for(let i=1;i<=cfg.lats;i++){
        const ry = Math.max(2, cfg.radius * Math.sin((i*Math.PI)/(cfg.lats*2)));
        const e = createNS('ellipse');
        e.setAttribute('rx', cfg.radius);
        e.setAttribute('ry', ry);
        e.setAttribute('class','stroke');
        g.appendChild(e);
      }
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

  function registerOrb(target, base){
    if (!target || target.dataset.orbReady) return;
    const redraw = () => {
      const w = target.clientWidth || parseInt(getComputedStyle(target).width)|| 320;
      const r = Math.max(60, Math.floor(Math.min(480, w)/2)-10);
      drawWireSphere(target, Object.assign({}, base||{}, { radius: r }));
    };
    // initial draw after layout
    requestAnimationFrame(()=>{ redraw(); });
    // resize observer
    if (window.ResizeObserver){
      const ro = new ResizeObserver(()=> redraw()); ro.observe(target);
    } else {
      window.addEventListener('resize', redraw);
    }
    // mutation guard (if some script wipes content)
    const mo = new MutationObserver((m)=>{
      if (!target.querySelector('svg')) redraw();
    });
    mo.observe(target, { childList:true });
    target.dataset.orbReady = '1';
    // also redraw on window load
    window.addEventListener('load', redraw, { once:true });
  }

  function initPageOrbs(){
    registerOrb(document.getElementById('hero-orb'), {});
    registerOrb(document.getElementById('vulcano-orb'), { radius: 60 });
    registerOrb(document.getElementById('crypto-orb-home'), { lons: 12, rotations:[15,45,75] });
  }

  window.addEventListener('DOMContentLoaded', initPageOrbs);
  window.VulcanoLogo = { drawWireSphere, signature: SIG };
})();
