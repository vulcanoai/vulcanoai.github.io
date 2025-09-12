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
    curator: 'Luciano AI',
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