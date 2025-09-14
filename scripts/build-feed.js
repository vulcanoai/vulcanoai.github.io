#!/usr/bin/env node
/**
 * Build consolidated feed and indices from data/runs and data/indie.
 * - Writes:
 *   - data/feed-latest.json
 *   - data/feed-YYYY-MM-DD.json (daily snapshots by discovery, for all days)
 *   - data/index/status.json
 *   - data/index/catalog.json
 *   - data/index/by-country.json
 *   - data/index/by-topic.json
 *   - data/index/by-source.json
 *   - data/index/runs.json
 *   - data/entries/YYYY-MM-DD/index.json (for today)
 *   - data/entries/YYYY-MM-DD/*.json (per-article trace files, today only)
 */
const fs = require('fs');
const { URL } = require('url');
const fsp = fs.promises;
const path = require('path');

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const RUNS_DIR = path.join(DATA_DIR, 'runs');
const INDIE_DIR = path.join(DATA_DIR, 'indie');
const INDEX_DIR = path.join(DATA_DIR, 'index');
const ENTRIES_DIR = path.join(DATA_DIR, 'entries');

function log(...args){ console.log('[build-feed]', ...args); }

async function ensureDir(p){ await fsp.mkdir(p, { recursive: true }); }
async function readJSON(file){ return JSON.parse(await fsp.readFile(file, 'utf8')); }
async function writeJSON(file, obj){
  await ensureDir(path.dirname(file));
  const tmp = file + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(obj, null, 2));
  await fsp.rename(tmp, file);
}

function toISO(d){ return new Date(d).toISOString(); }
function todayUTC(){ return new Date().toISOString().slice(0,10); }

// Slugify like the client (strip accents, non-alnum -> '-', trim '-')
function slugify(str){
  return (str||'').toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

// Same short hash as client
function shortHash(s){
  let h = 0; s = (s||'').toString();
  for (let i=0;i<s.length;i++){ h=((h<<5)-h) + s.charCodeAt(i); h|=0; }
  return ('00000000'+(h>>>0).toString(16)).slice(-8);
}

function hostnameOf(u){
  try { const h = new URL(u).hostname.toLowerCase(); return h.startsWith('www.') ? h.slice(4) : h; } catch { return ''; }
}

function canonicalizeUrl(u){
  try{
    const x = new URL(u);
    // Drop tracking params
    const drop = new Set(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','mc_cid','mc_eid']);
    for (const k of Array.from(x.searchParams.keys())){ if (drop.has(k.toLowerCase())) x.searchParams.delete(k); }
    return x.origin + x.pathname + (x.search ? ('?'+x.searchParams.toString()) : '');
  }catch{ return u; }
}

const STOPWORDS = new Set(['de','del','la','el','los','las','en','y','para','por','un','una','unos','unas','con','sobre','se','al','lo','a','que','su','sus','es','ai','ia']);
function normalizeTitle(t){
  return (t||'').toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9\s]+/g,' ')
    .replace(/\s+/g,' ').trim();
}
function titleKey(t){
  const norm = normalizeTitle(t);
  const toks = norm.split(' ').filter(w => w && !STOPWORDS.has(w) && w.length>=3);
  return toks.slice(0,10).join(' ');
}

async function loadAllowedHosts(){
  try{
    const src = await readJSON(path.join(DATA_DIR, 'sources.json'));
    const set = new Set();
    for (const s of (Array.isArray(src)?src:[])){
      const h = hostnameOf(s.url||''); if (h) set.add(h);
    }
    return set;
  }catch(_){ return new Set(); }
}

function isAllowedHost(u, allow){
  const h = hostnameOf(u); if (!h) return false;
  if (!allow || !allow.size) return true; // if no list, allow all
  if (allow.has(h)) return true;
  // subdomain suffix match
  for (const a of allow){ if (h===a || h.endsWith('.'+a)) return true; }
  return false;
}

async function verifyLinks(items, { maxConcurrent=10, timeoutMs=8000 }={}){
  const out = [];
  let i = 0;
  const worker = async () => {
    while (i < items.length){
      const idx = i++;
      const a = items[idx];
      let ok = false, finalUrl = a.url;
      try{
        const ctrl = new AbortController();
        const t = setTimeout(()=>ctrl.abort(), timeoutMs);
        let res = await fetch(a.url, { method:'HEAD', redirect:'follow', signal: ctrl.signal });
        if (!res.ok || (res.status >= 400)){
          // Some sites don't support HEAD; try GET with small size
          const ctrl2 = new AbortController();
          const t2 = setTimeout(()=>ctrl2.abort(), timeoutMs);
          res = await fetch(a.url, { method:'GET', redirect:'follow', signal: ctrl2.signal });
          clearTimeout(t2);
        }
        if (res.ok && res.status < 400){ ok = true; finalUrl = res.url || a.url; }
        clearTimeout(t);
      }catch(_){ ok = false; }
      if (ok){ out.push({ ...a, url: finalUrl }); }
    }
  };
  const workers = Array.from({length: Math.min(maxConcurrent, Math.max(1, items.length))}, ()=>worker());
  await Promise.all(workers);
  return out;
}

async function listRunFiles(){
  try{
    const files = await fsp.readdir(RUNS_DIR);
    return files.filter(f=>f.endsWith('.json'))
      .map(f=>({ file:f, full:path.join(RUNS_DIR,f) }))
      .sort((a,b)=> a.file.localeCompare(b.file)); // filename includes ISO-ish ordering
  }catch(e){ return []; }
}

async function loadRuns(){
  const files = await listRunFiles();
  const runs = [];
  for (const {file, full} of files){
    try{
      const j = await readJSON(full);
      const ts = j.timestamp || null;
      const count = Array.isArray(j.articles) ? j.articles.length : (j.count||0);
      const articles = Array.isArray(j.articles) ? j.articles : [];
      runs.push({ file, timestamp: ts, count, articles });
    }catch(e){ log('warn: failed to parse', file, e.message); }
  }
  // Sort by timestamp descending if present, else by filename desc
  runs.sort((a,b)=>{
    const at = a.timestamp || a.file; const bt = b.timestamp || b.file;
    return bt.localeCompare(at);
  });
  return runs;
}

async function loadIndie(){
  try{
    const files = await fsp.readdir(INDIE_DIR);
    const out = [];
    for (const f of files){
      if (!f.endsWith('.json')) continue;
      try{ out.push(await readJSON(path.join(INDIE_DIR,f))); }catch(_){ /* skip */ }
    }
    return out;
  }catch(_){ return []; }
}

function normalizeArticle(a){
  const val = (x, d='') => (x==null?d:String(x)).trim();
  const topics = (a.topics||a.temas||[]).map(t=>val(t)).filter(Boolean);
  const language = val(a.language||a.idioma||'es').slice(0,2).toLowerCase();
  let published_at = val(a.published_at||a.fecha);
  if (!published_at){ published_at = new Date().toISOString(); }
  return {
    id: a.id || a.url || a.link || shortHash(a.title||a.url||a.id||''),
    title: val(a.title||a.titulo,'Sin título'),
    summary: val(a.summary||a.resumen,''),
    url: val(a.url||a.link,'#'),
    source: val(a.source||a.fuente,'—'),
    source_url: val(a.source_url||a.fuente_url,''),
    country: val(a.country||a.pais,'Regional'),
    topics,
    language,
    published_at,
    relevance: a.relevance||a.relevancia||0,
    sentiment: val(a.sentiment||a.sentimiento||'neutral'),
    author: val(a.author||a.autor,''),
    curator: val(a.curator||a.curador||'Luciano AI')
  };
}

function dedupeArticles(arr){
  // Pass 1: by canonical URL
  const seenUrl = new Set();
  const tmp = [];
  for (const a of arr){
    const key = canonicalizeUrl(a.url || a.id || '');
    if (!key) continue;
    if (seenUrl.has(key)) continue;
    seenUrl.add(key);
    tmp.push({ ...a, url: key });
  }
  // Pass 2: by (host + titleKey) keep most recent
  const best = new Map();
  for (const a of tmp){
    const host = hostnameOf(a.url);
    const tk = titleKey(a.title);
    if (!host || !tk) { best.set(shortHash(a.url||a.id||a.title||''), a); continue; }
    const k = host + '|' + tk;
    const prev = best.get(k);
    if (!prev){ best.set(k, a); continue; }
    const at = new Date(a.published_at).getTime();
    const pt = new Date(prev.published_at).getTime();
    best.set(k, (isFinite(at) && isFinite(pt) && at>pt) ? a : prev);
  }
  return Array.from(best.values());
}

function groupCounts(arr, key){
  const m = new Map();
  for (const a of arr){
    if (key === 'topics'){
      for (const t of (a.topics||[])){ if (!t) continue; m.set(t, (m.get(t)||0)+1); }
    } else {
      const v = (a[key]||'').toString().trim();
      if (!v) continue; m.set(v, (m.get(v)||0)+1);
    }
  }
  return Object.fromEntries(Array.from(m.entries()).sort((a,b)=>b[1]-a[1]));
}

async function build(){
  // Safety guard: avoid accidental local data writes.
  // Allow in CI or when explicitly enabled.
  const allowLocal = process.env.CI || process.env.VULCANO_ALLOW_LOCAL_DATA_WRITE;
  if (!allowLocal) {
    console.error('[build-feed] Local write disabled. Set VULCANO_ALLOW_LOCAL_DATA_WRITE=1 to run locally.');
    return;
  }
  log('Starting');
  await Promise.all([ensureDir(DATA_DIR), ensureDir(INDEX_DIR), ensureDir(ENTRIES_DIR)]);

  const runs = await loadRuns();
  if (runs.length === 0){
    log('No runs found. Nothing to do.');
    return;
  }

  // Use all runs to avoid historical limits
  const usedRuns = runs;

  const indie = await loadIndie();

  // Merge all articles
  const mergedRaw = [];
  for (const r of usedRuns){
    for (const a of (r.articles||[])) mergedRaw.push(normalizeArticle(a));
  }
  for (const a of indie){ mergedRaw.push(normalizeArticle(a)); }
  let merged = dedupeArticles(mergedRaw)
    .sort((x,y)=> new Date(y.published_at) - new Date(x.published_at));

  // Reliability filters: recent items, valid URL, allowed host, live link
  const nowMs = Date.now();
  const MAX_AGE_MS = Number(process.env.FEED_MAX_AGE_DAYS || 180) * 24*3600*1000;
  const allow = await loadAllowedHosts();
  merged = merged.filter(a => {
    const u = (a.url||'').trim();
    if (!/^https?:\/\//i.test(u)) return false;
    if (!isAllowedHost(u, allow)) return false;
    const ts = new Date(a.published_at).getTime();
    if (!isFinite(ts)) return false;
    if (nowMs - ts > MAX_AGE_MS) return false;
    return true;
  });
  // Live link check (Network). Skip if disabled via env.
  if (process.env.VERIFY_LINKS !== '0'){
    const before = merged.length;
    merged = await verifyLinks(merged, { maxConcurrent: 8, timeoutMs: 8000 });
    log(`Verified links: ${merged.length}/${before} alive`);
  }

  const now = new Date();
  const nowISO = now.toISOString();
  const latestRunISO = usedRuns.find(r=>r.timestamp)?.timestamp || usedRuns[0]?.timestamp || nowISO;

  // Write feed-latest.json
  await writeJSON(path.join(DATA_DIR, 'feed-latest.json'), {
    version: 'v1.0',
    generated_at: nowISO,
    articles: merged
  });
  log('Wrote feed-latest.json with', merged.length, 'articles');

  // Write daily snapshots for all discovered days (by discovery date)
  const today = todayUTC();
  const allDays = Array.from(new Set(runs.map(r => (r.timestamp||'').slice(0,10)).filter(Boolean))).sort();
  for (const day of allDays){
    const dayRuns = runs.filter(r => (r.timestamp||'').slice(0,10) === day);
    const dayArticles = dedupeArticles((dayRuns.flatMap(r=>r.articles)||[]).map(normalizeArticle))
      .sort((x,y)=> new Date(y.published_at) - new Date(x.published_at));
    await writeJSON(path.join(DATA_DIR, `feed-${day}.json`), {
      version: 'v1.0',
      generated_at: nowISO,
      date: day,
      articles: dayArticles
    });
    if (day === today){
      log(`Wrote feed-${day}.json (today) with`, dayArticles.length, 'articles');
    }
  }

  // Indices
  const byCountry = groupCounts(merged, 'country');
  const byTopic = groupCounts(merged, 'topics');
  const bySource = groupCounts(merged, 'source');
  await writeJSON(path.join(INDEX_DIR, 'by-country.json'), {
    version: 'v1.0', generated_at: nowISO, byCountry
  });
  await writeJSON(path.join(INDEX_DIR, 'by-topic.json'), {
    version: 'v1.0', generated_at: nowISO, byTopic
  });
  await writeJSON(path.join(INDEX_DIR, 'by-source.json'), {
    version: 'v1.0', generated_at: nowISO, bySource
  });
  log('Wrote indices by country/topic/source');

  // Catalog of days (seen in runs)
  const days = allDays;
  await writeJSON(path.join(INDEX_DIR, 'catalog.json'), {
    version: 'v1.0', generated_at: nowISO, days
  });

  // Runs manifest
  await writeJSON(path.join(INDEX_DIR, 'runs.json'), {
    version: 'v1.0', generated_at: nowISO,
    runs: usedRuns.map(r => ({ file: r.file, timestamp: r.timestamp, count: r.count }))
  });

  // Status
  await writeJSON(path.join(INDEX_DIR, 'status.json'), {
    version: 'v1.0',
    generated_at: nowISO,
    last_run_iso: latestRunISO,
    last_feed_update: nowISO,
    feed_count: merged.length,
    ok: true
  });
  log('Updated status.json');

  // Story aggregation: cluster by normalized title across hosts
  function buildStories(items){
    const clusters = new Map();
    for (const a of items){
      const key = titleKey(a.title);
      if (!key) continue;
      const host = hostnameOf(a.url);
      const src = { source: a.source || host, host, url: a.url, published_at: a.published_at };
      if (!clusters.has(key)){
        clusters.set(key, { key, title: a.title, summary: a.summary || '', topics: new Set(a.topics||[]), countries: new Set([a.country||'Regional']), language: a.language||'es', first_at: a.published_at, last_at: a.published_at, sources: [src] });
      } else {
        const c = clusters.get(key);
        c.sources.push(src);
        (a.topics||[]).forEach(t=> c.topics.add(t));
        c.countries.add(a.country||'Regional');
        const at = new Date(a.published_at).getTime();
        const f = new Date(c.first_at).getTime();
        const l = new Date(c.last_at).getTime();
        if (isFinite(at) && (!isFinite(f) || at<f)) c.first_at = a.published_at;
        if (isFinite(at) && (!isFinite(l) || at>l)) c.last_at = a.published_at;
      }
    }
    const stories = Array.from(clusters.values()).map(s => ({
      key: s.key,
      title: s.title,
      summary: s.summary,
      topics: Array.from(s.topics),
      countries: Array.from(s.countries),
      language: s.language,
      first_at: s.first_at,
      last_at: s.last_at,
      sources: s.sources.sort((x,y)=> new Date(y.published_at)-new Date(x.published_at))
    })).sort((x,y)=> new Date(y.last_at) - new Date(x.last_at));
    return stories;
  }

  const stories = buildStories(merged);
  await writeJSON(path.join(INDEX_DIR, 'stories.json'), { version:'v1.0', generated_at: nowISO, count: stories.length, stories: stories.slice(0, 500) });
  // Today’s stories snapshot
  const today = todayUTC();
  await writeJSON(path.join(DATA_DIR, 'stories', `${today}.json`), { version:'v1.0', date: today, generated_at: nowISO, stories });

  // Entries for today: index + per-article files
  // Entries for all days (index + per-article files)
  for (const day of days){
    const dayRuns = runs.filter(r => (r.timestamp||'').slice(0,10) === day);
    const dayArticles = dedupeArticles((dayRuns.flatMap(r=>r.articles)||[]).map(normalizeArticle))
      .sort((x,y)=> new Date(y.published_at) - new Date(x.published_at));
    const dir = path.join(ENTRIES_DIR, day);
    await ensureDir(dir);
    await writeJSON(path.join(dir, 'index.json'), {
      date: day,
      count: dayArticles.length,
      topics: groupCounts(dayArticles, 'topics'),
      countries: groupCounts(dayArticles, 'country'),
      generated_at: nowISO
    });
    for (const a of dayArticles){
      const slug = slugify(a.title);
      const uniq = shortHash(a.url || a.id || a.title || '');
      const fname = `${slug}-${uniq}.json`;
      await writeJSON(path.join(dir, fname), { ...a, generated_at: nowISO, date: day });
    }
  }
}

build().catch(err => { console.error(err); process.exit(1); });
