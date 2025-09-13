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
  const seen = new Set();
  const out = [];
  for (const a of arr){
    const key = a.url || a.id;
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
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
  const merged = dedupeArticles(mergedRaw)
    .sort((x,y)=> new Date(y.published_at) - new Date(x.published_at));

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
