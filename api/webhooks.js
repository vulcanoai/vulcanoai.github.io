/*
  webhooks.js — Simple webhook endpoints for Vulcano AI
  
  This file provides webhook endpoints that can be deployed to Vercel, Netlify, 
  or any serverless platform to interface with n8n workflows.
  
  Usage:
  - POST /api/trigger-update - Manually trigger news pipeline
  - POST /api/indie-submit - Submit independent article
  - GET /api/status - Get current system status
*/

const crypto = require('crypto');

// Configuration from environment variables
const N8N_WEBHOOK_BASE = process.env.N8N_WEBHOOK_BASE || 'https://n8n.vulcano.ai/webhook';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Verify webhook signature
function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// CORS headers for local development
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Hub-Signature-256');
}

// Main webhook handler
export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  try {
    switch (pathname) {
      case '/api/trigger-update':
        return await handleTriggerUpdate(req, res);
      case '/api/indie-submit':
        return await handleIndieSubmit(req, res);
      case '/api/ai-propose':
        return await handleAIPropose(req, res);
      case '/api/ai-review':
        return await handleAIReview(req, res);
      case '/api/ai-submit':
        return await handleAISubmit(req, res);
      case '/api/status':
        return await handleStatus(req, res);
      default:
        return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

// Handle AI agent submissions (autonomous researcher)
async function handleAISubmit(req, res){
  if (req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try{
    const body = req.body || {};
    const payload = Array.isArray(body) ? { articles: body } : body;
    const arr = Array.isArray(payload.articles) ? payload.articles : [];
    if (!arr.length){
      return res.status(400).json({ error: 'No articles provided' });
    }
    // Normalize and validate
    const candidates = arr.map(a => normalizeArticle(a)).filter(x => x.title && x.url);
    const items = [];
    for (const it of candidates){
      const [ok, allowed] = await Promise.all([
        verifyUrl(it.url), isAllowedHost(it.url)
      ]);
      if (!ok || !allowed) continue;
      items.push(it);
    }
    if (!items.length){
      return res.status(400).json({ error: 'No valid articles after normalization' });
    }

    // Prepare GitHub write (category ai-research)
    const contentObj = { version:'v1.0', category:'ai-research', generated_at: new Date().toISOString(), articles: items };
    const content = Buffer.from(JSON.stringify(contentObj, null, 2)).toString('base64');
    const pathLatest = 'data/ai-research/feed-latest.json';
    const snapshotPath = `data/ai-research/feed-${new Date().toISOString().slice(0,10)}.json`;
    const base = 'https://api.github.com/repos/vulcanoai/vulcanoai.github.io/contents';

    async function putFile(path, message){
      // Get existing sha (if any)
      let sha;
      try{
        const h = await fetch(`${base}/${path}?ref=main`, { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept':'application/vnd.github+json' } });
        if (h.ok){ const j = await h.json(); sha = j.sha; }
      }catch(_){ /* ignore */ }
      const body = { message, content, branch:'main' };
      if (sha) body.sha = sha;
      const r = await fetch(`${base}/${path}`, {
        method:'PUT',
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type':'application/json', 'Accept':'application/vnd.github+json' },
        body: JSON.stringify(body)
      });
      if (!r.ok){ throw new Error(`GitHub PUT ${path} failed: ${r.status}`); }
    }

    await putFile(pathLatest, 'chore(ai-research): update feed-latest.json');
    await putFile(snapshotPath, 'chore(ai-research): snapshot');

    return res.status(200).json({ success:true, wrote: [pathLatest, snapshotPath], count: items.length });
  }catch(err){
    console.error('AI submit failed:', err);
    return res.status(500).json({ success:false, error: err.message });
  }
}

// Utility: GitHub API request
async function gh(path, method='GET', body){
  const url = `https://api.github.com/repos/vulcanoai/vulcanoai.github.io${path}`;
  const headers = { 'Accept':'application/vnd.github+json' };
  if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body? JSON.stringify(body): undefined });
  if (!r.ok){ const t = await r.text(); throw new Error(`GitHub ${method} ${path} -> ${r.status} ${t}`); }
  return r.json();
}

async function getContent(path){
  try{
    const j = await gh(`/contents/${encodeURIComponent(path)}?ref=main`, 'GET');
    if (j && j.content){
      const txt = Buffer.from(j.content, 'base64').toString('utf8');
      return { sha: j.sha, json: JSON.parse(txt) };
    }
  }catch(_){ /* no file */ }
  return { sha: null, json: null };
}

async function putContent(path, message, obj){
  const cur = await getContent(path);
  const content = Buffer.from(JSON.stringify(obj, null, 2)).toString('base64');
  const body = { message, content, branch:'main' };
  if (cur.sha) body.sha = cur.sha;
  await gh(`/contents/${encodeURIComponent(path)}`, 'PUT', body);
}

async function updateReviewsManifest(mutator){
  const p = 'data/index/reviews.json';
  const cur = await getContent(p);
  const base = cur.json || { version:'v1.0', generated_at: new Date().toISOString(), open_prs:0, pending_reviews:0, last_review:null, items:[] };
  const next = await mutator(base);
  next.version = 'v1.0';
  next.generated_at = new Date().toISOString();
  await putContent(p, 'chore(reviews): update manifest', next);
}

// Handle AI Proposals: create PR with proposed articles
async function handleAIPropose(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });
  try{
    const body = req.body || {};
    const articles = Array.isArray(body.articles) ? body.articles : [];
    const proposer = String(body.proposer || 'Codex 1');
    if (!articles.length) return res.status(400).json({ error:'No articles' });

    // Get main head sha
    const ref = await gh('/git/ref/heads/main');
    const baseSha = ref.object.sha;
    const ts = new Date().toISOString().replace(/[:.]/g,'-');
    const proposalId = `p-${ts}-${Math.random().toString(36).slice(2,8)}`;
    const branch = `proposals/${proposalId}`;
    // Create branch
    await gh('/git/refs', 'POST', { ref:`refs/heads/${branch}`, sha: baseSha });
    // Put proposal content in branch
    const folder = `data/proposals/${proposalId}`;
    const payload = { version:'v1.0', proposer, created_at: new Date().toISOString(), articles };
    const content = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');
    await gh(`/contents/${encodeURIComponent(folder+'/articles.json')}`, 'PUT', { message:`feat(proposal): ${proposalId}`, content, branch });
    // Open PR
    const pr = await gh('/pulls', 'POST', { title:`AI Proposal ${proposalId}`, head: branch, base:'main', body:`Proposed by ${proposer} — ${articles.length} articles.` });

    // Update reviews manifest
    await updateReviewsManifest(async (m) => {
      m.items = m.items || [];
      m.items.unshift({ id: proposalId, pr: pr.number, title: pr.title, status:'open', proposer, created_at: pr.created_at, updated_at: pr.created_at, reviews: [] });
      m.open_prs = (m.items.filter(x=>x.status==='open').length)||0;
      m.pending_reviews = m.open_prs; // simplistic initial metric
      return m;
    });

    return res.status(200).json({ success:true, proposal: proposalId, pr: pr.number, url: pr.html_url });
  }catch(err){
    console.error('AI propose failed:', err);
    return res.status(500).json({ success:false, error: err.message });
  }
}

// Handle AI Reviews: record review and optionally merge
async function handleAIReview(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });
  try{
    const { pr_number, reviewer, decision='comment', comment='' } = req.body || {};
    if (!pr_number || !reviewer) return res.status(400).json({ error:'Missing pr_number or reviewer' });
    let event = 'COMMENT';
    if (decision === 'approve') event = 'APPROVE';
    else if (decision === 'reject') event = 'REQUEST_CHANGES';
    await gh(`/pulls/${pr_number}/reviews`, 'POST', { body: comment || `${reviewer}: ${decision}`, event });

    // Optionally auto-merge if approved
    if (decision === 'approve'){
      try{ await gh(`/pulls/${pr_number}/merge`, 'PUT', { merge_method:'squash', commit_title:`merge: AI proposal #${pr_number}` }); }catch(_){ /* ignore */ }
    }

    await updateReviewsManifest(async (m) => {
      m.items = m.items || [];
      const it = m.items.find(x => x.pr === pr_number);
      const now = new Date().toISOString();
      if (it){
        it.reviews = it.reviews || [];
        it.reviews.push({ reviewer, decision, timestamp: now, comment });
        it.updated_at = now;
        if (decision === 'approve') it.status = 'approved';
        if (decision === 'reject') it.status = 'changes_requested';
      }
      m.last_review = { pr: pr_number, reviewer, decision, timestamp: now };
      m.open_prs = (m.items.filter(x=>x.status==='open' || x.status==='changes_requested').length)||0;
      m.pending_reviews = (m.items.filter(x=>x.status==='open').length)||0;
      return m;
    });

    return res.status(200).json({ success:true });
  }catch(err){
    console.error('AI review failed:', err);
    return res.status(500).json({ success:false, error: err.message });
  }
}

// Handle manual pipeline trigger
async function handleTriggerUpdate(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { reason, priority = 'normal' } = req.body || {};
  
  // Validate request
  if (!reason) {
    return res.status(400).json({ error: 'Missing reason field' });
  }
  
  try {
    // Trigger n8n webhook
    const response = await fetch(`${N8N_WEBHOOK_BASE}/manual-trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBHOOK_SECRET}`
      },
      body: JSON.stringify({
        reason,
        priority,
        timestamp: new Date().toISOString(),
        source: 'api-trigger'
      })
    });
    
    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    return res.status(200).json({
      success: true,
      message: 'Pipeline triggered successfully',
      reason,
      priority,
      timestamp: new Date().toISOString(),
      n8n_response: result
    });
    
  } catch (error) {
    console.error('Failed to trigger n8n:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to trigger pipeline',
      details: error.message 
    });
  }
}

// Handle independent article submission
async function handleIndieSubmit(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const article = req.body;
  
  // Validate required fields
  const requiredFields = ['title', 'url', 'summary'];
  const missingFields = requiredFields.filter(field => !article[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      missing: missingFields,
      required: requiredFields
    });
  }
  
  // Validate URL format
  try {
    new URL(article.url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }
  
  // Normalize article data
  const normalizedArticle = {
    id: `indie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: article.title.trim(),
    summary: article.summary.trim().substring(0, 300),
    url: article.url,
    source: article.source || 'Envío independiente',
    source_url: article.source_url || '',
    country: article.country || 'Regional',
    topics: Array.isArray(article.topics) ? article.topics : ['Comunidad'],
    language: article.language || 'es',
    published_at: article.published_at || new Date().toISOString(),
    relevance: Math.min(Math.max(article.relevance || 7, 1), 10),
    sentiment: ['positive', 'neutral', 'negative'].includes(article.sentiment) ? article.sentiment : 'neutral',
    author: article.author || 'Comunidad',
    curator: 'Codex 1',
    submission_type: 'independent',
    submitted_at: new Date().toISOString()
  };
  
  try {
    // Submit to GitHub directly (for now, could be routed through n8n)
    const content = JSON.stringify([normalizedArticle], null, 2);
    const filename = `indie-${new Date().toISOString().slice(0, 10)}-${normalizedArticle.id}.json`;
    
    const githubResponse = await fetch(`https://api.github.com/repos/vulcanoai/vulcanoai.github.io/contents/data/indie/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `feat(indie): add independent submission ${normalizedArticle.id}`,
        content: Buffer.from(content).toString('base64')
      })
    });
    
    if (!githubResponse.ok) {
      throw new Error(`GitHub API failed: ${githubResponse.status}`);
    }
    
    return res.status(201).json({
      success: true,
      message: 'Article submitted successfully',
      article: normalizedArticle,
      github_url: `https://github.com/vulcanoai/vulcanoai.github.io/blob/main/data/indie/${filename}`
    });
    
  } catch (error) {
    console.error('Failed to submit article:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to submit article',
      details: error.message 
    });
  }
}

// Handle status check
async function handleStatus(req, res) {
  const timestamp = new Date().toISOString();
  
  try {
    // Check if we can reach GitHub API
    const githubCheck = await fetch('https://api.github.com/repos/vulcanoai/vulcanoai.github.io', {
      headers: GITHUB_TOKEN ? { 'Authorization': `token ${GITHUB_TOKEN}` } : {}
    });
    
    const githubStatus = githubCheck.ok ? 'operational' : 'degraded';
    
    // Try to fetch current feed
    let feedStatus = 'unknown';
    let articleCount = 0;
    try {
      const feedResponse = await fetch('https://vulcanoai.github.io/data/feed-latest.json');
      if (feedResponse.ok) {
        const feedData = await feedResponse.json();
        articleCount = feedData.articles ? feedData.articles.length : feedData.length || 0;
        feedStatus = 'operational';
      } else {
        feedStatus = 'degraded';
      }
    } catch {
      feedStatus = 'error';
    }
    
    return res.status(200).json({
      status: 'operational',
      timestamp,
      services: {
        github: githubStatus,
        feed: feedStatus,
        webhooks: 'operational'
      },
      metrics: {
        article_count: articleCount,
        last_update: timestamp
      },
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
    
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      timestamp,
      error: error.message
    });
  }
}

// ---------- Helper: raw body (for GitHub signature) ----------
function getRawBody(req){
  return new Promise((resolve, reject) => {
    try{
      const chunks=[]; req.on('data', c=>chunks.push(Buffer.from(c)));
      req.on('end', ()=>resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    }catch(e){ reject(e); }
  });
}

// ---------- Validation helpers ----------
function hostnameOf(u){ try{ const h=new URL(u).hostname.toLowerCase(); return h.startsWith('www.')?h.slice(4):h; }catch{ return ''; } }
async function loadAllowedHosts(){
  try{
    const r = await fetch('https://vulcanoai.github.io/data/sources.json', { cache:'no-store' });
    const arr = await r.json(); const set = new Set();
    for (const s of (Array.isArray(arr)?arr:[])){
      try{ const h = hostnameOf(s.url||''); if (h) set.add(h); }catch(_){/* noop */}
    }
    return set;
  }catch(_){ return new Set(); }
}
let __allowCache = { ts:0, set:new Set() };
async function isAllowedHost(url){
  const now = Date.now(); if (now-__allowCache.ts > 5*60*1000){ __allowCache.set = await loadAllowedHosts(); __allowCache.ts = now; }
  const host = hostnameOf(url); const set = __allowCache.set; if(!set||!set.size) return false;
  if (set.has(host)) return true; for (const h of set){ if (host===h || host.endsWith('.'+h)) return true; }
  return false;
}
async function verifyUrl(url, timeoutMs=10000){
  try{
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(), timeoutMs);
    let r = await fetch(url, { method:'HEAD', redirect:'follow', signal: ctrl.signal });
    if(!r.ok || r.status>=400){ clearTimeout(t); const ctrl2=new AbortController(); const t2=setTimeout(()=>ctrl2.abort(), timeoutMs); r = await fetch(url,{method:'GET', redirect:'follow', signal: ctrl2.signal}); clearTimeout(t2); }
    clearTimeout(t); return r.ok && r.status<400;
  }catch(_){ return false; }
}
function normalizeArticle(a){
  const val=(x,d='')=>(x==null?d:String(x)).trim();
  let lang = val(a.language||'es').slice(0,2).toLowerCase(); if(!lang) lang='es';
  let pub = val(a.published_at); if(!pub) pub=new Date().toISOString();
  return { id: val(a.id)||val(a.url)||val(a.title)||`ai-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    title: val(a.title,'Sin título'), summary: val(a.summary).slice(0,500), url: val(a.url,'#'),
    source: val(a.source), source_url: val(a.source_url) || (a.url? new URL(a.url).origin: ''),
    country: val(a.country,'Regional'), topics: Array.isArray(a.topics)?a.topics:[],
    language: lang, published_at: pub, relevance: Number(a.relevance||6), sentiment: val(a.sentiment,'neutral'),
    author: val(a.author), curator: val(a.curator,'Codex 1') };
}
function dedupeByUrl(arr){ const seen=new Set(); const out=[]; for (const a of (arr||[])){ const k=(a&&a.url)?a.url.trim():''; if(!k||seen.has(k)) continue; seen.add(k); out.push(a);} return out; }

// ---------- GitHub webhook: PR merged -> publish ----------
async function handleGitHubWebhook(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });
  try{
    const raw = await getRawBody(req);
    const secret = process.env.GITHUB_WEBHOOK_SECRET || WEBHOOK_SECRET || '';
    const sig = req.headers['x-hub-signature-256'] || '';
    if (secret){ if (!verifySignature(raw, sig, secret)) return res.status(401).json({ error:'Bad signature' }); }
    const event = req.headers['x-github-event'] || '';
    const body = JSON.parse(raw.toString('utf8'));
    if (event==='pull_request' && body?.action==='closed' && body?.pull_request?.merged){
      const pr = body.pull_request.number;
      // list files
      const files = await gh(`/pulls/${pr}/files`, 'GET');
      const targets = (files||[]).filter(f=>/^data\/proposals\/.+\/articles\.json$/.test(f.filename)).map(f=>f.filename);
      let merged = [];
      for (const p of targets){ const c = await getContent(p); if (c.json && Array.isArray(c.json.articles)) merged.push(...c.json.articles); }
      // validate & allowlist
      const filtered = [];
      for (const it of merged){ const a = normalizeArticle(it); if(!a.url||!a.title) continue; const [ok,allowed]=await Promise.all([verifyUrl(a.url),isAllowedHost(a.url)]); if(!ok||!allowed) continue; filtered.push(a); }
      // ai-research feed
      const catPath='data/ai-research/feed-latest.json'; const catCur=await getContent(catPath); const baseArr=Array.isArray(catCur.json?.articles)?catCur.json.articles:[]; const catAll=dedupeByUrl([...filtered, ...baseArr]);
      await putContent(catPath, 'chore(ai-research): update feed-latest.json', { version:'v1.0', category:'ai-research', generated_at:new Date().toISOString(), articles: catAll });
      // consolidated
      const consPath='data/feed-latest.json'; const consCur=await getContent(consPath); const consArr=Array.isArray(consCur.json?.articles)?consCur.json.articles:(Array.isArray(consCur.json)?consCur.json:[]); const consAll=dedupeByUrl([...filtered, ...consArr]);
      await putContent(consPath, 'chore(feed): consolidate after merge', { version:'v1.0', generated_at:new Date().toISOString(), articles: consAll });
      // status
      const stPath='data/index/status.json'; const stCur=await getContent(stPath); const st=stCur.json||{}; st.version='v1.0'; st.generated_at=new Date().toISOString(); st.last_feed_update=new Date().toISOString(); st.feed_count=consAll.length; await putContent(stPath, 'chore(status): update after merge', st);
      // reviews manifest
      await updateReviewsManifest(async (m)=>{ const it=(m.items||[]).find(x=>x.pr===pr); if (it){ it.status='merged'; it.updated_at=new Date().toISOString(); } m.open_prs=(m.items||[]).filter(x=>x.status==='open'||x.status==='changes_requested').length; m.pending_reviews=(m.items||[]).filter(x=>x.status==='open').length; return m; });
      return res.status(200).json({ success:true, pr, added: filtered.length });
    }
    return res.status(200).json({ ok:true });
  }catch(err){ console.error('github webhook error', err); return res.status(500).json({ error:'Internal error' }); }
}
